import { useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { uploadImageFile } from '@/lib/editor/imageStorage'
import { copyText } from '@/lib/clipboard'
import { UI_LABELS } from '@/lib/uiLabels'

/**
 * 通用图片上传 Hook。
 * 上传图片到图床，自动复制链接到剪贴板，并通过 onToast 回调提示用户。
 */
export function useImageUpload(onToast: (msg: string) => void) {
  const imageHostConfig = useStore((s) => s.imageHostConfig)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImageFile(file, imageHostConfig)
      await copyText(url)
      onToast(UI_LABELS.imageUpload.successToast(imageHostConfig.activeType))
    } catch (err) {
      console.error(err)
      onToast(`${UI_LABELS.imageUpload.errorToast}: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const triggerUpload = () => fileInputRef.current?.click()

  return {
    fileInputRef,
    uploading,
    triggerUpload,
    handleFileChange,
  }
}
