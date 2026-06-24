import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callAiStream, isAiConfigReady } from './aiService'

/* ------------------------------------------------------------------ */
/*  helpers: 构造 mock fetch 响应                                       */
/* ------------------------------------------------------------------ */
const encoder = new TextEncoder()

/** 将 SSE 文本行数组编码为 Uint8Array 数组，模拟流式分块送达 */
function encodeSseLines(lines: string[]): Uint8Array[] {
  return lines.map((line) => encoder.encode(line))
}

/** 构造含 mock body.getReader() 的成功响应 */
function makeOkResponse(chunks: Uint8Array[]) {
  let index = 0
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: {
      getReader() {
        return {
          read() {
            if (index < chunks.length) {
              const value = chunks[index++]
              return Promise.resolve({ value, done: false })
            }
            return Promise.resolve({ value: undefined, done: true })
          },
        }
      },
    },
    text: () => Promise.resolve(''),
  } as unknown as Response
}

function makeErrorResponse(status: number, body = '') {
  return {
    ok: false,
    status,
    statusText: status === 500 ? 'Internal Server Error' : 'Error',
    body: null,
    text: () => Promise.resolve(body),
  } as unknown as Response
}

/* ------------------------------------------------------------------ */
/*  callAiStream                                                       */
/* ------------------------------------------------------------------ */
describe('callAiStream', () => {
  const config = { apiUrl: 'https://api.example.com/', apiKey: 'sk-test', model: 'gpt-4' }
  const messages = [{ role: 'user' as const, content: 'Hello' }]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('正常流式响应：onChunk 逐块回调，返回完整拼接内容', async () => {
    const chunks = encodeSseLines([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
      'data: [DONE]\n\n',
    ])
    vi.mocked(fetch).mockResolvedValue(makeOkResponse(chunks))

    const onChunk = vi.fn()
    const result = await callAiStream(config, messages, onChunk)

    expect(onChunk).toHaveBeenCalledTimes(3)
    expect(onChunk).toHaveBeenCalledWith('Hello')
    expect(onChunk).toHaveBeenCalledWith(' World')
    expect(onChunk).toHaveBeenCalledWith('!')
    expect(result).toBe('Hello World!')
  })

  it('URL 末尾有多余斜杠时应正确拼接端点', async () => {
    const chunks = encodeSseLines([
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
      'data: [DONE]\n\n',
    ])
    vi.mocked(fetch).mockResolvedValue(makeOkResponse(chunks))

    await callAiStream(config, messages, vi.fn())

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('HTTP 错误应抛出包含状态码的 Error', async () => {
    vi.mocked(fetch).mockResolvedValue(makeErrorResponse(401, 'Unauthorized'))

    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow('API 请求失败 (401): Unauthorized')
  })

  it('HTTP 错误且 text() 失败时应使用 statusText', async () => {
    const res = makeErrorResponse(500, '')
    res.text = () => Promise.reject('fail')
    vi.mocked(fetch).mockResolvedValue(res)

    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow('Internal Server Error')
  })

  it('AbortSignal 中断时应抛出 AbortError', async () => {
    const controller = new AbortController()
    vi.mocked(fetch).mockImplementation(() => {
      return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))
    })

    await expect(
      callAiStream(config, messages, vi.fn(), controller.signal),
    ).rejects.toThrow('aborted')
  })

  it('应将 signal 透传给 fetch', async () => {
    const controller = new AbortController()
    const chunks = encodeSseLines([
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
      'data: [DONE]\n\n',
    ])
    vi.mocked(fetch).mockResolvedValue(makeOkResponse(chunks))

    await callAiStream(config, messages, vi.fn(), controller.signal)

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it('流中包含非 data: 前缀的行应被忽略', async () => {
    const chunks = encodeSseLines([
      'some random line\n\n',
      'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
      '\n\n',
      'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
      'data: [DONE]\n\n',
    ])
    vi.mocked(fetch).mockResolvedValue(makeOkResponse(chunks))

    const onChunk = vi.fn()
    const result = await callAiStream(config, messages, onChunk)

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk).toHaveBeenCalledWith('A')
    expect(onChunk).toHaveBeenCalledWith('B')
    expect(result).toBe('AB')
  })
})

/* ------------------------------------------------------------------ */
/*  isAiConfigReady                                                    */
/* ------------------------------------------------------------------ */
describe('isAiConfigReady', () => {
  it('URL 和 Key 均已填写应返回 true', () => {
    expect(isAiConfigReady({ apiUrl: 'https://api.example.com', apiKey: 'sk-abc' })).toBe(true)
  })

  it('URL 为空应返回 false', () => {
    expect(isAiConfigReady({ apiUrl: '', apiKey: 'sk-abc' })).toBe(false)
  })

  it('Key 为空应返回 false', () => {
    expect(isAiConfigReady({ apiUrl: 'https://api.example.com', apiKey: '' })).toBe(false)
  })

  it('URL 和 Key 均为空应返回 false', () => {
    expect(isAiConfigReady({ apiUrl: '', apiKey: '' })).toBe(false)
  })

  it('仅包含空白字符时应返回 false', () => {
    expect(isAiConfigReady({ apiUrl: '   ', apiKey: '  ' })).toBe(false)
  })

  it('URL 前后有空格但有实质内容时应返回 true', () => {
    expect(isAiConfigReady({ apiUrl: ' https://x.com ', apiKey: 'sk-1 ' })).toBe(true)
  })
})
