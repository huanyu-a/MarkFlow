/**
 * OpenAI 兼容协议 API 客户端。
 * 支持 DeepSeek / Moonshot / 通义千问 / OpenAI 等所有兼容 /v1/chat/completions 的服务。
 */

export interface AiCallConfig {
  apiUrl: string
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 流式调用 OpenAI 兼容 API，逐块返回内容。
 * 返回的字符串为完整的 assistant 回复文本。
 */
export async function callAiStream(
  config: AiCallConfig,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const url = `${config.apiUrl.replace(/\/+$/, '')}/v1/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || undefined,
      messages,
      stream: true,
      temperature: 0.7,
    }),
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

  return fullContent
}

/** 校验 AI 配置是否完整（URL + Key 均已填写） */
export function isAiConfigReady(config: { apiUrl: string; apiKey: string }): boolean {
  return Boolean(config.apiUrl.trim() && config.apiKey.trim())
}
