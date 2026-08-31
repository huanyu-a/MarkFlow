import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callAiStream, buildAiRequestInfo, isAiConfigReady } from '@/lib/aiService'

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
    headers: new Headers({ 'content-type': 'text/event-stream' }),
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

  it('URL 末尾有多余斜杠时应通过代理并携带上游端点', async () => {
    const chunks = encodeSseLines([
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
      'data: [DONE]\n\n',
    ])
    vi.mocked(fetch).mockResolvedValue(makeOkResponse(chunks))

    await callAiStream(config, messages, vi.fn())

    expect(fetch).toHaveBeenCalledWith(
      '/__markflow_ai_proxy',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Markflow-Ai-Url': 'https://api.example.com/v1/chat/completions',
        }),
        body: expect.stringContaining('"model":"gpt-4"'),
        signal: undefined,
      }),
    )
  })

  it('HTTP 错误应抛出包含状态码的 Error', async () => {
    vi.mocked(fetch).mockResolvedValue(makeErrorResponse(401, 'Unauthorized'))

    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow('API 请求失败 (401): Unauthorized')
  })

  it('HTTP 错误响应为完整 HTML 页面时，应给出友好提示而非倾泻页面文本', async () => {
    const htmlPage = '<!DOCTYPE html><html><head><style>body{color:red}</style></head><body>' +
      '<nav>首页</nav><script>alert(1)</script><p>页面未找到</p>' + 'x'.repeat(500) + '</body></html>'
    vi.mocked(fetch).mockResolvedValue(makeErrorResponse(404, htmlPage))

    // 不应包含页面正文片段（「首页 页面未找到」），也不应包含任何标签或截断省略号
    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow(
      /API 请求失败 \(404\): 接口地址返回了网页而非 API 响应/,
    )
    await expect(callAiStream(config, messages, vi.fn())).rejects.not.toThrow(/首页/)
  })

  it('HTML 错误响应但 content-type 缺失时，同样识别为网页并友好提示', async () => {
    const htmlPage = '<!DOCTYPE html><html><body>整页错误内容</body></html>'
    const res = makeErrorResponse(404, htmlPage)
    // makeErrorResponse 未带 headers，content-type 缺失，靠 body 特征兜底
    vi.mocked(fetch).mockResolvedValue(res)

    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow(
      '接口地址返回了网页而非 API 响应',
    )
  })

  it('JSON 错误体应优先提取 error.message', async () => {
    const jsonBody = JSON.stringify({ error: { message: 'Incorrect API key provided', type: 'auth' } })
    vi.mocked(fetch).mockResolvedValue(makeErrorResponse(401, jsonBody))

    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow(
      'API 请求失败 (401): Incorrect API key provided',
    )
  })

  it('200 但返回 HTML 页面（SPA fallback）应显式报错而非静默无输出', async () => {
    const htmlOk = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      body: null,
      text: () => Promise.resolve('<!DOCTYPE html><html><body>index</body></html>'),
    } as unknown as Response
    vi.mocked(fetch).mockResolvedValue(htmlOk)

    await expect(callAiStream(config, messages, vi.fn())).rejects.toThrow('HTML 页面而非 JSON 流')
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
/*  buildAiRequestInfo：dev 走本地代理 / 生产直连上游                   */
/* ------------------------------------------------------------------ */
describe('buildAiRequestInfo', () => {
  const upstream = 'https://api.example.com/v1/chat/completions'

  it('dev 模式：请求本地代理并携带 X-Markflow-Ai-Url', () => {
    const info = buildAiRequestInfo(upstream, 'sk-test', true)
    expect(info.url).toBe('/__markflow_ai_proxy')
    expect(info.viaProxy).toBe(true)
    expect(info.headers['X-Markflow-Ai-Url']).toBe(upstream)
    expect(info.headers.Authorization).toBe('Bearer sk-test')
  })

  it('dev 模式：Key 为空不携带 Authorization', () => {
    const info = buildAiRequestInfo(upstream, '  ', true)
    expect(info.headers.Authorization).toBeUndefined()
  })

  it('生产模式：直连上游，不携带代理头（纯静态部署无本地代理）', () => {
    const info = buildAiRequestInfo(upstream, 'sk-test', false)
    expect(info.url).toBe(upstream)
    expect(info.viaProxy).toBe(false)
    expect(info.headers['X-Markflow-Ai-Url']).toBeUndefined()
    expect(info.headers.Authorization).toBe('Bearer sk-test')
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

  it('本地 API 地址可留空 Key', () => {
    expect(isAiConfigReady({ apiUrl: 'http://127.0.0.1:20128/v1', apiKey: '' })).toBe(true)
    expect(isAiConfigReady({ apiUrl: 'http://localhost:8080/v1', apiKey: '' })).toBe(true)
  })
})