#!/usr/bin/env node
// MarkFlow 渲染 API（供「排版 skill」与自动化调用）
//
//   POST /__markflow_render   body: { markdown, accent?, dark? }
//                             返回: { ok, html, meta: { title, summary } }
//   GET  /__markflow_render   返回: { ok, guide }（最新的公众号排版语法指令全文）
//
// 鉴权：请求头 X-Render-Token 必须与服务端环境变量 MARKFLOW_RENDER_TOKEN 一致。
// 环境变量：
//   MARKFLOW_RENDER_TOKEN  必填，未设置时拒绝启动（防止裸奔上公网）
//   MARKFLOW_RENDER_PORT   监听端口，默认 8788（仅监听 127.0.0.1，由 nginx 反代）
//
// 依赖：render-bundle.mjs（由 tools/render-server/build.mjs 生成）+ jsdom。
// jsdom 仅用于给净化器慢路径提供 DOMParser/Node 垫片；引擎常规输出走字符串快速路径。
import { createServer } from 'node:http'
import crypto from 'node:crypto'
import { JSDOM } from 'jsdom'

// ---------- jsdom 垫片（必须在 import bundle 之前注入） ----------
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
// Node 21+ 的 navigator 是 globalThis 上的只读 getter，统一用 defineProperty 覆盖
for (const [key, value] of Object.entries({
  DOMParser: dom.window.DOMParser,
  XMLSerializer: dom.window.XMLSerializer,
  Node: dom.window.Node,
  Element: dom.window.Element,
  Document: dom.window.Document,
  DocumentFragment: dom.window.DocumentFragment,
  document: dom.window.document,
  navigator: dom.window.navigator,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
})) {
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
}

const { renderMarkdown, makeColors, THEMES, darkenHex, buildArticleAiGuide } = await import('./render-bundle.mjs')

// ---------- 配置 ----------
const PORT = Number(process.env.MARKFLOW_RENDER_PORT || 8788)
const TOKEN = process.env.MARKFLOW_RENDER_TOKEN || ''
if (!TOKEN) {
  console.error('[render-server] 缺少 MARKFLOW_RENDER_TOKEN 环境变量，拒绝启动')
  process.exit(1)
}

// 与前端默认主题一致（appStore DEFAULT_ACCENT = THEMES[3]）
const DEFAULT_THEME = THEMES[3] || THEMES[0]
const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB，足以容纳含 base64 图片的长文

// ---------- 工具 ----------
function tokenOk(req) {
  const got = String(req.headers['x-render-token'] || '')
  if (got.length !== TOKEN.length) return false
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(TOKEN))
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// ---------- 预览页模板：带复制按钮，交付给用户点按钮后粘贴公众号编辑器 ----------
// html 片段已过 sanitizeHtml（script 等危险标签被剥离），可安全内嵌；
// 复制源码直接取 #article 的 outerHTML，避免把片段再转义一遍嵌进 <script>。
function buildPreview(html, title, theme) {
  const safeTitle = escapeHtml(title || '未命名文章')
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle} - MarkFlow 预览</title>
<style>
  body { margin:0; background:#f2f3f5; font-family:system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif; }
  .toolbar { position:sticky; top:0; z-index:10; display:flex; gap:10px; align-items:center; justify-content:center; padding:10px; background:rgba(255,255,255,.92); border-bottom:1px solid #e5e7eb; backdrop-filter:blur(6px); }
  .toolbar button { padding:7px 16px; border:1px solid ${theme.accent}; border-radius:8px; background:${theme.accent}; color:#fff; font-size:13px; cursor:pointer; }
  .toolbar button.ghost { background:#fff; color:${theme.accent}; }
  .toolbar .tip { font-size:12px; color:#9ca3af; }
  .page { max-width:677px; margin:20px auto 60px; background:#fff; padding:32px 24px; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,.06); }
</style>
</head>
<body>
<div class="toolbar">
  <button id="copy-rich">复制全文</button>
  <button id="copy-src" class="ghost">复制源码</button>
  <span class="tip">复制后到公众号编辑器 Ctrl+V 粘贴</span>
</div>
<div class="page"><div id="article">${html}</div></div>
<script>
const article = document.getElementById('article');
const btnRich = document.getElementById('copy-rich');
const btnSrc = document.getElementById('copy-src');

function flash(btn, text) {
  const old = btn.textContent;
  btn.textContent = text;
  setTimeout(function () { btn.textContent = old; }, 1600);
}

function selectArticle() {
  const range = document.createRange();
  range.selectNodeContents(article);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return sel;
}

async function copyRich() {
  // 富文本复制：选中正文节点后 execCommand('copy')，剪贴板同时带 text/html
  // 与 text/plain，公众号编辑器 Ctrl+V 可保留内联样式；file:// 下可用
  try {
    const sel = selectArticle();
    if (document.execCommand('copy')) { sel.removeAllRanges(); return true; }
    sel.removeAllRanges();
  } catch (e) {}
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([article.innerHTML], { type: 'text/html' }),
      'text/plain': new Blob([article.innerText], { type: 'text/plain' }),
    })]);
    return true;
  } catch (e) { return false; }
}

async function copySource() {
  const text = article.innerHTML;
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

btnRich.addEventListener('click', async function () {
  flash(btnRich, (await copyRich()) ? '✓ 已复制，去公众号粘贴' : '复制失败，请手动全选复制');
});
btnSrc.addEventListener('click', async function () {
  flash(btnSrc, (await copySource()) ? '✓ 已复制' : '复制失败');
});
</script>
</body>
</html>`
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req, res) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('请求体超过 2MB 限制'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// ---------- HTTP 服务 ----------
const server = createServer(async (req, res) => {
  const url = (req.url || '').split('?')[0]
  if (url !== '/__markflow_render') {
    sendJson(res, 404, { ok: false, error: 'not found' })
    return
  }

  if (!tokenOk(req)) {
    sendJson(res, 401, { ok: false, error: 'X-Render-Token 无效' })
    return
  }

  try {
    if (req.method === 'GET') {
      // 返回当前版本的排版语法指令，供外部 AI / skill 直接取用
      sendJson(res, 200, { ok: true, guide: buildArticleAiGuide() })
      return
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: '仅支持 GET / POST' })
      return
    }

    const raw = await readBody(req, res)
    let payload
    try {
      payload = JSON.parse(raw || '{}')
    } catch {
      sendJson(res, 400, { ok: false, error: '请求体不是合法 JSON' })
      return
    }

    const markdown = payload.markdown
    if (typeof markdown !== 'string' || markdown.trim() === '') {
      sendJson(res, 400, { ok: false, error: 'markdown 字段缺失或为空' })
      return
    }

    // 主题色：accent+dark 成对传入最稳；只传 accent 时深色自动派生（加深 25%）；
    // 都不传用默认主题。实际取值经响应 theme 字段回传，便于调用方向用户说明。
    const hasAccent = isHexColor(payload.accent)
    const hasDark = isHexColor(payload.dark)
    const accent = hasAccent ? payload.accent : DEFAULT_THEME.accent
    const dark = hasDark ? payload.dark : (hasAccent ? darkenHex(accent, 0.25) : DEFAULT_THEME.dark)
    const { html, meta } = renderMarkdown(markdown, makeColors(accent, dark))

    sendJson(res, 200, {
      ok: true,
      html,
      meta: { title: meta.title, summary: meta.summary },
      theme: { accent, dark },
      // 带复制按钮的完整预览页：交付文件直接用它（用户点「复制全文」→ 公众号编辑器 Ctrl+V）
      preview: buildPreview(html, meta.title, { accent, dark }),
    })
  } catch (err) {
    const status = err && err.status ? err.status : 500
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[render-server] ${req.method} ${url} 失败:`, message)
    sendJson(res, status, { ok: false, error: message })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[render-server] listening on 127.0.0.1:${PORT}`)
})
