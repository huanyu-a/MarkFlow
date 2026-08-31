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

/**
 * 计算请求目标与请求头。
 *
 * - dev：经 vite 本地代理（vite.config.ts 的 markflow-ai-proxy 中间件）转发，
 *   彻底绕开浏览器 CORS 限制；
 * - 生产：本项目为零后端纯静态部署，/__markflow_ai_proxy 不存在（静态托管
 *   甚至可能以 SPA fallback 返回 index.html 导致静默失败），必须直连上游。
 *   直连要求 API 服务支持浏览器跨域（DeepSeek / OpenAI / Moonshot 等均支持）。
 */
export interface AiRequestInfo {
  url: string
  headers: Record<string, string>
  /** 是否经 dev 本地代理 */
  viaProxy: boolean
}

export function buildAiRequestInfo(
  upstreamUrl: string,
  apiKey: string,
  dev: boolean,
): AiRequestInfo {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`
  }
  if (dev) {
    headers['X-Markflow-Ai-Url'] = upstreamUrl
    return { url: '/__markflow_ai_proxy', headers, viaProxy: true }
  }
  return { url: upstreamUrl, headers, viaProxy: false }
}

/**
 * 提炼错误响应体用于展示。
 * 错误响应可能是完整 HTML 页面（静态托管 SPA fallback、网关错误页等），
 * 直接塞进错误提示会出现整页源码的红色报错墙——先去标签再截断。
 */
function summarizeErrorBody(text: string, maxLen = 160): string {
  if (!text) return ''
  const stripped = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return ''
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped
}

/** 判断响应是否为 HTML 页面（而非预期的 JSON/SSE 流） */
function isHtmlResponse(res: Response): boolean {
  // 部分环境/旧实现的 Response 可能没有标准 headers 对象，缺省视为非 HTML
  const type = res.headers?.get?.('content-type') || ''
  return /text\/html|application\/xhtml\+xml/i.test(type)
}

/** 判断响应体是否为 HTML 页面内容（content-type 缺失时兜底，如网关/静态托管） */
function looksLikeHtmlBody(text: string): boolean {
  return /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(text)
}

/**
 * 从错误响应体中提炼可读信息：
 * - 标准 OpenAI 兼容错误是 JSON，优先取 error.message / message；
 * - 其他文本去标签截断；HTML 页面直接放弃提炼（错误页正文对用户毫无价值）。
 */
function extractErrorDetail(text: string): string {
  if (!text) return ''
  if (looksLikeHtmlBody(text)) return ''
  try {
    const json = JSON.parse(text)
    const msg = json?.error?.message ?? json?.message
    if (typeof msg === 'string' && msg.trim()) return summarizeErrorBody(msg)
  } catch {
    // 非 JSON 错误体，走通用文本提炼
  }
  return summarizeErrorBody(text)
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

  const req = buildAiRequestInfo(upstreamUrl, config.apiKey, import.meta.env.DEV)

  let res: Response
  try {
    res = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body,
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    if (!req.viaProxy) {
      throw new Error(
        '无法直连 AI 接口（可能被浏览器 CORS 拦截或网络不可达）。' +
        '请换用支持浏览器跨域直连的 API 服务，或用 pnpm dev 启动开发模式经本地代理调用。',
      )
    }
    throw err
  }

  // 静态托管的 SPA fallback 会以 200 返回站点 HTML 页面，导致后续 SSE
  // 解析静默无输出——在这里显式拦截并给出可行动的提示
  if (res.ok && isHtmlResponse(res)) {
    throw new Error(
      req.viaProxy
        ? 'AI 接口返回了 HTML 页面而非 JSON 流，请检查「设置 → AI 配置」中的 API 地址是否正确'
        : 'AI 接口地址指向了一个网页而非 API 端点，请检查「设置 → AI 配置」中的 API 地址（通常应以 /v1 结尾或为服务方提供的 API 域名）',
    )
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    if (isHtmlResponse(res) || looksLikeHtmlBody(raw)) {
      throw new Error(
        `API 请求失败 (${res.status}): 接口地址返回了网页而非 API 响应，` +
        '请检查「设置 → AI 配置」中的 API 地址是否正确（通常应以 /v1 结尾）',
      )
    }
    const detail = extractErrorDetail(raw)
    throw new Error(`API 请求失败 (${res.status}): ${detail || res.statusText}`)
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
    const tail = buffer.trim()
    if (tail && tail !== 'data: [DONE]' && tail !== '[DONE]') {
      try {
        const json = JSON.parse(tail.replace(/^data: /, ''))
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
