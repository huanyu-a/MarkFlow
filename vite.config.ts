import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'
import { assertSafeHttpUrl, fetchWithTimeout } from './src/lib/fetchSafe'

/**
 * MathJax tex-svg 字体数据拆分插件
 *
 * tex-svg chunk 包含 MathJax 的 TeX 解析器 + SVG 渲染器 + 字体数据（~908 KB），
 * 其中 defaultChars 字体对象字面量占 51%。此插件在 build 的 generateBundle 阶段
 * 将字体数据提取为独立的同步 <script> 资源，在 tex-svg chunk 执行前通过
 * globalThis 注入，使主 tex-svg chunk 体积减半。
 *
 * 执行时序（安全保证）：
 * 1. mathRenderer.ts 中 import('mathjax/es5/tex-svg.js') 触发浏览器获取 tex-svg chunk
 * 2. 浏览器解析 tex-svg chunk 时，先执行头部注入的 loader <script>（sync, blocking）
 * 3. loader script 加载 fonts chunk 并设置 globalThis.__MATHJAX_FONTS__
 * 4. tex-svg 主代码执行，读取 globalThis.__MATHJAX_FONTS__ 初始化字体
 *
 * 为什么用 generateBundle 而非 renderChunk：
 * tex-svg 是 mathjax/es5/tex-svg.js 的预构建产物，Vite 将其作为 pre-bundled
 * dependency 直接 emit 为 asset，不经过 Rollup 的 renderChunk 管线。
 * generateBundle 在所有 chunk 写入 dist 前触发，此时可修改 chunk code 并 emit 新文件。
 */
function mathJaxFontSplitter(): Plugin {
  return {
    name: 'mathjax-font-splitter',
    enforce: 'post',

    generateBundle(_options, bundle) {
      // 1. 找到 tex-svg chunk（体积最大且包含 defaultChars）
      let texSvgChunk = null
      let texSvgFileName: string | null = null
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          chunk.type === 'chunk' &&
          chunk.code &&
          chunk.code.length > 1_500_000 &&
          chunk.code.includes('defaultChars')
        ) {
          texSvgChunk = chunk
          texSvgFileName = fileName
          break
        }
      }
      if (!texSvgChunk || !texSvgFileName) return

      const code = texSvgChunk.code

      // 2. 定位 defaultChars={normal:{32:...} 的实际字体数据（非空初始化 {}）
      //    MathJax 中有多处 defaultChars=，第一个是空对象初始化，第二个包含完整字体数据
      const marker = 'defaultChars={normal:'
      const markerIdx = code.indexOf(marker)
      if (markerIdx === -1) return

      const objStart = markerIdx + 'defaultChars='.length
      if (code[objStart] !== '{') return

      // 3. 括号匹配找到对象的完整边界
      let depth = 0
      let objEnd = objStart
      for (let i = objStart; i < code.length; i++) {
        if (code[i] === '{') depth++
        if (code[i] === '}') {
          depth--
          if (depth === 0) { objEnd = i + 1; break }
        }
      }

      const fontDataStr = code.substring(objStart, objEnd)
      if (fontDataStr.length < 100_000) return // 安全阈值

      // 4. 提取字体数据为独立 asset 文件
      const fontFileName = texSvgFileName.replace(/\.js$/, '-fonts.js')
      this.emitFile({
        type: 'asset',
        fileName: fontFileName,
        source: `globalThis.__MATHJAX_FONTS__=${fontDataStr};`,
      })

      // 5. 替换原 chunk 中的字体对象字面量为 globalThis 引用
      const newCode =
        code.substring(0, objStart) +
        'globalThis.__MATHJAX_FONTS__' +
        code.substring(objEnd)

      // 6. 注入同步 loader <script>（chunk 头部）
      //    构建后 chunk 与 fonts 文件在同一目录，通过 import.meta.url 定位
      const loader = `(function(){var u=import.meta.url.replace(/[^/\\\\]*$/,'${fontFileName}');var s=document.createElement('script');s.src=u;s.async=false;document.head.appendChild(s);s.onload=function(){s.remove()}})();`

      texSvgChunk.code = loader + newCode

      console.log(`[mathjax-font-splitter] tex-svg: ${(code.length / 1024).toFixed(0)} KB -> ${(texSvgChunk.code.length / 1024).toFixed(0)} KB (font data: ${(fontDataStr.length / 1024).toFixed(0)} KB)`)
    },
  }
}

/**
 * 本地微信公众号草稿发布代理
 *
 * 纯前端无法直接调用微信 API（CORS + AppSecret 不能暴露到页面），
 * 因此 dev server 增加本地代理：前端只把内容 POST 到 /__markflow_wechat_publish，
 * 由 Node 侧获取 access_token 并调用 draft/add。
 */
function wechatPublishDevServer(): Plugin {
  async function readJsonBody(req: { on: (event: 'data' | 'end' | 'error', cb: (chunk?: unknown) => void) => void }): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let raw = ''
      req.on('data', (chunk) => {
        raw += String(chunk)
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(raw || '{}'))
        } catch (e) {
          reject(e instanceof Error ? e : new Error('invalid json'))
        }
      })
      req.on('error', (err) => reject(err instanceof Error ? err : new Error('request error')))
    })
  }

  async function getAccessToken(appId: string, appSecret: string): Promise<string> {
    const url = new URL('https://api.weixin.qq.com/cgi-bin/token')
    url.searchParams.set('grant_type', 'client_credential')
    url.searchParams.set('appid', appId)
    url.searchParams.set('secret', appSecret)
    const safeUrl = assertSafeHttpUrl(url.toString())
    const res = await fetchWithTimeout(safeUrl.toString(), { timeoutMs: 15000 })
    const data = (await res.json()) as { access_token?: string; errcode?: number; errmsg?: string }
    if (!data.access_token) {
      throw new Error(`获取 access_token 失败：${data.errcode ?? res.status} ${data.errmsg ?? ''}`)
    }
    return data.access_token
  }

  async function createWeChatDraft(
    token: string,
    body: { title: string; content: string; thumbMediaId: string },
  ): Promise<{ mediaId?: string; errcode?: number; errmsg?: string }> {
    const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/add')
    url.searchParams.set('access_token', token)
    const safeUrl = assertSafeHttpUrl(url.toString())
    const res = await fetchWithTimeout(safeUrl.toString(), {
      timeoutMs: 20000,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articles: [
          {
            title: body.title,
            author: '',
            digest: '',
            content: body.content,
            content_source_url: '',
            thumb_media_id: body.thumbMediaId,
            need_open_comment: 0,
            only_fans_can_comment: 0,
          },
        ],
      }),
    })
    const data = (await res.json()) as { media_id?: string; errcode?: number; errmsg?: string }
    if (!data.media_id) {
      return { errcode: data.errcode ?? res.status, errmsg: data.errmsg ?? `HTTP ${res.status}` }
    }
    return { mediaId: data.media_id }
  }

  async function uploadCoverImage(token: string, imageUrl: string): Promise<string> {
    if (!/^https?:\/\//i.test(imageUrl)) {
      throw new Error(`封面图必须是可访问的 http(s) URL：${imageUrl}`)
    }
    const imgRes = await fetchWithTimeout(imageUrl, { timeoutMs: 20000 })
    if (!imgRes.ok) {
      throw new Error(`下载封面图失败：HTTP ${imgRes.status}`)
    }
    const buffer = await imgRes.arrayBuffer()
    const ext = imageUrl.split(/[?#]/)[0].toLowerCase().match(/\.(png|jpe?g|webp|gif)$/)?.[1] ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
    const form = new FormData()
    form.append('media', new Blob([buffer], { type: mime }), `cover.${ext}`)
    const url = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material')
    url.searchParams.set('access_token', token)
    url.searchParams.set('type', 'image')
    const safeUploadUrl = assertSafeHttpUrl(url.toString())
    const upRes = await fetchWithTimeout(safeUploadUrl.toString(), { method: 'POST', body: form, timeoutMs: 60000 })
    const data = (await upRes.json()) as { media_id?: string; errcode?: number; errmsg?: string }
    if (!data.media_id) {
      throw new Error(`上传封面图失败：${data.errcode ?? upRes.status} ${data.errmsg ?? ''}`)
    }
    return data.media_id
  }

  function extractFirstImageUrl(content: string): string {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    return match?.[1] ?? ''
  }

  return {
    name: 'markflow-wechat-publish',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__markflow_wechat_publish', async (req, res) => {
        const sendError = (status: number, error: string) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error }))
        }
        try {
          const body = await readJsonBody(req)
          const appId = String(body.appId ?? '')
          const appSecret = String(body.appSecret ?? '')
          const configuredMediaId = String(body.thumbMediaId ?? '')
          const coverImageUrl = String(body.coverImageUrl ?? '').trim()
          const title = String(body.title ?? '未命名文章')
          const content = String(body.content ?? '')
          if (!appId || !appSecret) {
            sendError(400, '缺少 AppID / AppSecret')
            return
          }
          const token = await getAccessToken(appId, appSecret)
          const firstImageUrl = extractFirstImageUrl(content)
          const autoCoverUrl = coverImageUrl || firstImageUrl

          let thumbMediaId = configuredMediaId
          if (thumbMediaId) {
            const first = await createWeChatDraft(token, { title, content, thumbMediaId })
            if (first.mediaId) {
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true, media_id: first.mediaId }))
              return
            }
            if (!String(first.errcode ?? '').includes('40007') && !/invalid media id/i.test(first.errmsg ?? '')) {
              sendError(502, `创建草稿失败：${first.errcode} ${first.errmsg}`)
              return
            }
            if (!autoCoverUrl) {
              sendError(502, `封面素材 thumb_media_id 无效（40007），且未找到可自动上传的封面 URL。请在设置中填写封面图 URL，或确认素材属于当前公众号`)
              return
            }
            thumbMediaId = await uploadCoverImage(token, autoCoverUrl)
          } else {
            if (!autoCoverUrl) {
              sendError(400, '未配置 thumb_media_id，且正文没有可访问的图片 URL。请在设置中填写封面图 URL')
              return
            }
            thumbMediaId = await uploadCoverImage(token, autoCoverUrl)
          }

          const result = await createWeChatDraft(token, { title, content, thumbMediaId })
          if (!result.mediaId) {
            sendError(502, `创建草稿失败：${result.errcode} ${result.errmsg}`)
            return
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: true, media_id: result.mediaId, thumb_media_id: thumbMediaId }))
        } catch (e) {
          sendError(502, e instanceof Error ? e.message : '未知错误')
        }
      })
    },
  }
}
/**
 * 本地 Catbox 免费图床代理
 * Catbox 直连可能受 CORS 限制，前端在上传失败时回退到该代理。
 */
function freeImageHostDevServer(): Plugin {
  async function readJsonBody(req: { on: (event: 'data' | 'end' | 'error', cb: (chunk?: unknown) => void) => void }): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let raw = ''
      req.on('data', (chunk) => {
        raw += String(chunk)
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(raw || '{}'))
        } catch (e) {
          reject(e instanceof Error ? e : new Error('invalid json'))
        }
      })
      req.on('error', (err) => reject(err instanceof Error ? err : new Error('request error')))
    })
  }

  async function uploadToCatbox(body: Record<string, unknown>): Promise<string> {
    const filename = String(body.filename ?? 'image.jpg')
    const mime = String(body.mime ?? 'image/jpeg')
    const base64 = String(body.data ?? '')
    const buffer = Buffer.from(base64, 'base64')
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', new Blob([buffer], { type: mime }), filename)
    const res = await fetchWithTimeout('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    })
    const text = await res.text()
    const url = text.trim()
    if (!res.ok || !/^https?:\/\//i.test(url)) {
      throw new Error(url || `Catbox upload failed（HTTP ${res.status}）`)
    }
    return url
  }

  return {
    name: 'markflow-free-image-host',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__markflow_image_host/catbox', async (req, res) => {
        try {
          const body = await readJsonBody(req)
          const url = await uploadToCatbox(body)
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(url)
        } catch (e) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(e instanceof Error ? e.message : '未知错误')
        }
      })
    },
  }
}

/**
 * AI 排版本地代理
 * OpenAI 兼容 API 通常不允许浏览器直连，这里把流式请求转发到用户配置的上游地址。
 */
function aiProxyDevServer(): Plugin {
  async function readRawBody(req: { on: (event: 'data' | 'end' | 'error', cb: (chunk?: unknown) => void) => void }): Promise<string> {
    return new Promise((resolve, reject) => {
      let raw = ''
      req.on('data', (chunk) => {
        raw += String(chunk)
      })
      req.on('end', () => resolve(raw))
      req.on('error', (err) => reject(err instanceof Error ? err : new Error('request error')))
    })
  }

  return {
    name: 'markflow-ai-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__markflow_ai_proxy', async (req, res) => {
        try {
          const target = String(req.headers['x-markflow-ai-url'] || '')
          if (!target) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end('缺少 X-Markflow-Ai-Url')
            return
          }
          const raw = await readRawBody(req)
          const upstreamHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
          }
          if (req.headers.authorization) {
            upstreamHeaders.Authorization = req.headers.authorization
          }
          const safeTarget = assertSafeHttpUrl(target)
          const upstream = await fetchWithTimeout(safeTarget.toString(), {
            method: 'POST',
            headers: upstreamHeaders,
            body: raw,
          })
          res.writeHead(upstream.status, {
            'Content-Type': upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
          })
          if (upstream.body) {
            const reader = upstream.body.getReader()
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(Buffer.from(value))
            }
          }
          res.end()
        } catch (e) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(e instanceof Error ? `AI 代理转发失败：${e.message}` : 'AI 代理转发失败')
        }
      })
    },
  }
}

// 构建基础路径，通过环境变量 MARKFLOW_BASE_URL 配置，默认 /MarkFlow/
// 独立部署：默认 /MarkFlow/ → https://huanyu-a.github.io/MarkFlow/
// Wiki 集成：MARKFLOW_BASE_URL=/markflow/ → https://www.bx9y.com.cn/markflow/
const baseUrl = process.env.MARKFLOW_BASE_URL || '/MarkFlow/'

// MarkFlow 构建配置
export default defineConfig({
  base: baseUrl,
  plugins: [
    react(),
    tailwindcss(),
    mathJaxFontSplitter(),
    wechatPublishDevServer(),
    freeImageHostDevServer(),
    aiProxyDevServer(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MarkFlow — Markdown 多场景渲染工作台',
        short_name: 'MarkFlow',
        description: '纯前端 Markdown / HTML 多场景渲染与导出工作台',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'zh-CN',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      // 开发模式下禁用 Service Worker，避免缓存导致的调试问题
      devOptions: {
        enabled: false,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: `${baseUrl}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${baseUrl.replace(/\//g, '\\/')}workbox-`)],
        // 分层缓存：预缓存仅含应用外壳，JS 大块走运行时缓存
        globPatterns: ['**/*.{css,html,svg,png,woff2}'],
        globIgnores: ['assets/*.js'],
        runtimeCaching: [
          {
            // 主入口 + 懒加载 chunk：首次访问后缓存，离线可复用
            urlPattern: /\/assets\/.+\.js$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // @ 指向 src（应用代码），@engine 指向移植自 r-markdown 的框架无关渲染引擎
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
          'codemirror-vendor': [
            '@codemirror/language',
            '@codemirror/lang-markdown',
            '@codemirror/lang-html',
            '@uiw/react-codemirror',
            'codemirror'
          ],
          'engine-vendor': ['highlight.js', 'katex'],
          // 注意：'mathjax-vendor': ['mathjax'] 已移除。
          // mathjax 包是 CommonJS 预构建包，manualChunks 无法有效拆分，
          // 只会产生一个 360 字节的空 stub。实际的 MathJax 代码通过
          // dynamic import('mathjax/es5/tex-svg.js') 加载，由 Vite 自动拆为独立 chunk，
          // 再经上方 mathJaxFontSplitter 插件进一步拆分字体数据。
        }
      }
    }
  },
  esbuild: {
    pure: ['console.log'],
    drop: ['debugger']
  }
})
