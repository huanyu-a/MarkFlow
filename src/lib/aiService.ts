/**
 * OpenAI 兼容协议 API 客户端。
 * 支持 DeepSeek / Moonshot / 通义千问 / OpenAI 等所有兼容 /v1/chat/completions 的服务。
 */

export interface AiCallConfig {
  apiUrl: string
  apiKey: string
  model: string
}

import { isPrivateHost } from './fetchSafe'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 流式调用 OpenAI 兼容 API，逐块返回内容。
 * 返回的字符串为完整的 assistant 回复文本。
 */
function buildCompletionsUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, '')
  if (/\/chat\/completions$/i.test(clean)) return clean
  if (/\/v1$/i.test(clean)) return `${clean}/chat/completions`
  return `${clean}/v1/chat/completions`
}

function assertAiUpstreamUrl(url: string): void {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('AI 接口地址为空')
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('AI 接口地址仅支持 http(s) 协议')
  }

  try {
    const parsed = new URL(trimmed)
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')

    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1)$/i.test(hostname)) {
      return
    }

    if (/^http:\/\//i.test(trimmed)) {
      throw new Error('非本地 AI 接口请使用 https 地址')
    }

    if (isPrivateHost(hostname)) {
      throw new Error('AI 接口地址不能指向内网地址')
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('AI 接口地址格式不正确')
  }
}

export async function callAiStream(
  config: AiCallConfig,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const upstreamUrl = buildCompletionsUrl(config.apiUrl)
  assertAiUpstreamUrl(upstreamUrl)
  const body = JSON.stringify({
    model: config.model || undefined,
    messages,
    stream: true,
    temperature: 0.7,
  })

  // 浏览器直连 OpenAI 兼容 API 通常会被 CORS 拦截，因此优先走本地 dev 代理。
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Markflow-Ai-Url': upstreamUrl,
  }
  if (config.apiKey.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`
  }

  const res = await fetch('/__markflow_ai_proxy', {
    method: 'POST',
    headers,
    body,
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API 请求失败 (${res.status}): ${text || res.statusText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('当前浏览器不支持流式响应')

  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const json = JSON.parse(data)
          const delta: string = json.choices?.[0]?.delta?.content || ''
          if (delta) {
            fullContent += delta
            onChunk(delta)
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }
    // flush 解码器：多字节字符跨块截断时补出剩余字节，避免丢尾
    buffer += decoder.decode()
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer.trim().replace(/^data: /, ''))
        const delta: string = json.choices?.[0]?.delta?.content || ''
        if (delta) {
          fullContent += delta
          onChunk(delta)
        }
      } catch {
        // 末尾残留非完整数据，忽略
      }
    }
  } finally {
    // 异常/取消路径释放流锁，避免连接与缓冲滞留；部分实现/mock 可能无 cancel
    try {
      Promise.resolve(reader.cancel?.()).catch(() => {})
    } catch {
      // ignore
    }
  }

  return fullContent
}

export function validateAiUpstreamUrlForTests(url: string): void {
  assertAiUpstreamUrl(url)
}

function isLocalApiUrl(url: string): boolean {
  const clean = url.trim().toLowerCase()
  return (
    clean.startsWith('http://localhost') ||
    clean.startsWith('http://127.0.0.1') ||
    clean.startsWith('http://[::1]') ||
    clean.startsWith('http://0.0.0.0')
  )
}

/** 校验 AI 配置是否完整；本地 API 允许不填 Key */
export function isAiConfigReady(config: { apiUrl: string; apiKey: string }): boolean {
  const url = config.apiUrl.trim()
  if (!url) return false
  if (isLocalApiUrl(url)) return true
  return Boolean(url && config.apiKey.trim())
}
