import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import {
  clearLocalImageUrlCache,
  compileMarkdownImages,
  createImageUploadFile,
  getCachedImageUrl,
  getAllCachedImageIds,
  getLocalImage,
  preloadImagesFromMarkdown,
  resolveImageUrl,
  revokeImageUrl,
  saveLocalImage,
  validateImageFile,
} from './imageStorage'

// 模拟 FileReader
class MockFileReader {
  onloadend: (() => void) | null = null
  result: string = ''
  readAsDataURL(_blob: Blob) {
    this.result = 'data:image/jpeg;base64,dGVzdC1pbWFnZS1kYXRh'
    setTimeout(() => {
      this.onloadend?.()
    })
  }
}
globalThis.FileReader = MockFileReader as any

const mockDatabase = new Map<string, any>()
const createObjectUrlMock = vi.fn((blob: Blob) => `blob:mock-${blob.size}-${createObjectUrlMock.mock.calls.length}`)
const revokeObjectUrlMock = vi.fn()

beforeEach(() => {
  mockDatabase.clear()
  clearLocalImageUrlCache()
  createObjectUrlMock.mockClear()
  revokeObjectUrlMock.mockClear()
})

beforeAll(() => {
  const mockStore = {
    get: (id: string) => {
      const req = {
        onsuccess: null as any,
        onerror: null as any,
        result: mockDatabase.get(id) || null
      }
      setTimeout(() => req.onsuccess?.())
      return req
    },
    put: (blob: any, id: string) => {
      mockDatabase.set(id, blob)
      const req = {
        onsuccess: null as any,
        onerror: null as any
      }
      setTimeout(() => req.onsuccess?.())
      return req
    }
  }

  const mockTx = {
    objectStore: () => mockStore
  }

  const mockDb = {
    transaction: () => mockTx,
    objectStoreNames: {
      contains: () => true
    }
  }

  const mockOpenReq = {
    onsuccess: null as any,
    onupgradeneeded: null as any,
    result: mockDb
  }

  globalThis.indexedDB = {
    open: () => {
      setTimeout(() => {
        mockOpenReq.onsuccess?.()
      })
      return mockOpenReq as any
    }
  } as any

  globalThis.URL.createObjectURL = createObjectUrlMock
  globalThis.URL.revokeObjectURL = revokeObjectUrlMock
})

describe('imageStorage - compileMarkdownImages', () => {
  it('should save and get local images from IndexedDB', async () => {
    const blob = new Blob(['hello-world'], { type: 'image/jpeg' })
    await saveLocalImage('img_12345', blob)
    const retrieved = await getLocalImage('img_12345')
    expect(retrieved).not.toBeNull()
    expect(retrieved?.type).toBe('image/jpeg')
  })

  it('should compile img:// tags into base64', async () => {
    const blob = new Blob(['hello-world'], { type: 'image/jpeg' })
    await saveLocalImage('img_12345', blob)

    const md = 'Here is an image: ![alt text](img://img_12345) and some text.'
    const result = await compileMarkdownImages(md)
    expect(result).toBe('Here is an image: ![alt text](data:image/jpeg;base64,dGVzdC1pbWFnZS1kYXRh) and some text.')
  })

  it('should return original text if no local images are present', async () => {
    const md = 'Here is a regular link: [Google](https://google.com) and text.'
    const result = await compileMarkdownImages(md)
    expect(result).toBe(md)
  })

  it('should leave unknown local images as is', async () => {
    const md = 'Here is an unknown image: ![alt text](img://img_99999).'
    const result = await compileMarkdownImages(md)
    expect(result).toBe(md)
  })

  it('should resolve img:// id to cached object url', async () => {
    const blob = new Blob(['hello-world'], { type: 'image/jpeg' })
    await saveLocalImage('img_object_url', blob)

    const first = await resolveImageUrl('img_object_url')
    const second = await resolveImageUrl('img_object_url')

    expect(first).toMatch(/^blob:mock-/)
    expect(second).toBe(first)
    expect(getCachedImageUrl('img_object_url')).toBe(first)
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1)
  })

  it('should revoke image object url by id', async () => {
    const blob = new Blob(['hello-world'], { type: 'image/jpeg' })
    await saveLocalImage('img_revoke', blob)
    const url = await resolveImageUrl('img_revoke')

    revokeImageUrl('img_revoke')

    expect(getCachedImageUrl('img_revoke')).toBeUndefined()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith(url)
  })

  it('should prune unused image object urls from markdown', async () => {
    await saveLocalImage('img_keep', new Blob(['keep'], { type: 'image/jpeg' }))
    await saveLocalImage('img_drop', new Blob(['drop'], { type: 'image/jpeg' }))
    const keepUrl = await resolveImageUrl('img_keep')
    const dropUrl = await resolveImageUrl('img_drop')

    await preloadImagesFromMarkdown(`![keep](img://img_keep)`)

    expect(getCachedImageUrl('img_keep')).toBe(keepUrl)
    expect(getCachedImageUrl('img_drop')).toBeUndefined()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith(dropUrl)
  })

  it('should evict oldest object urls when cache exceeds limit', async () => {
    for (let i = 0; i < 65; i++) {
      const id = `img_lru_${i}`
      await saveLocalImage(id, new Blob([String(i)], { type: 'image/jpeg' }))
      await resolveImageUrl(id)
    }

    expect(getCachedImageUrl('img_lru_0')).toBeUndefined()
    expect(getCachedImageUrl('img_lru_64')).toBeDefined()
    expect(getAllCachedImageIds()).toHaveLength(64)
    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(1)
  })

  it('should validate image file type and size', async () => {
    const jpegBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], { type: 'image/jpeg' })
    const jpegFile = new File([jpegBlob], 'test.jpg', { type: 'image/jpeg' })
    const result = await validateImageFile(jpegFile)
    expect(result).toBe('image/jpeg')
  })

  it('should reject non-image files', async () => {
    const textFile = new File(['text'], 'test.txt', { type: 'text/plain' })
    await expect(validateImageFile(textFile)).rejects.toThrow('请选择图片文件')
  })

  it('should reject oversized files', async () => {
    const largeBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], { type: 'image/jpeg' })
    const largeFile = new File([largeBlob], 'large.jpg', { type: 'image/jpeg' })
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })
    await expect(validateImageFile(largeFile)).rejects.toThrow('图片不能超过 10MB')
  })

  it('should create upload file with correct extension', () => {
    const blob = new Blob(['data'], { type: 'image/png' })
    const original = new File([''], 'original.jpg', { type: 'image/jpeg' })
    const uploadFile = createImageUploadFile(original, blob)
    expect(uploadFile.name).toBe('original.png')
    expect(uploadFile.type).toBe('image/png')
  })

})
