// 预览页模板（带复制按钮）— 由 render_server.mjs 与 smoke-test.mjs 共用。
//
// html 片段已过 sanitizeHtml（script 等危险标签被剥离），可安全内嵌；
// 复制源码直接取 #article 的 outerHTML，避免把片段再转义一遍嵌进 <script>。
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// KaTeX 公式样式：preview 是自包含单文件，而公式 HTML（output:'html'）依赖 katex.css。
// 这里从本地 node_modules 读入 katex.min.css 内联进 <style>；css 内字体是相对路径
// 引用（url(fonts/...）），统一改写为 jsdelivr CDN 绝对地址，保证浏览器打开 preview
// 时公式字体可用。本地找不到 katex（如服务器只装了 jsdom）时回退为 CDN <link>。
function loadKatexCss() {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url))
    const distDir = path.join(dir, '..', '..', 'node_modules', 'katex', 'dist')
    const pkg = JSON.parse(readFileSync(path.join(distDir, '..', 'package.json'), 'utf8'))
    const css = readFileSync(path.join(distDir, 'katex.min.css'), 'utf8')
    return css.split('url(fonts/').join(`url(https://cdn.jsdelivr.net/npm/katex@${pkg.version}/dist/fonts/`)
  } catch {
    return ''
  }
}

const KATEX_CSS = loadKatexCss()
const KATEX_CSS_VERSION = '0.17.0' // 本地 katex 缺失时的 CDN 兜底版本

export function buildPreview(html, title, theme) {
  const safeTitle = escapeHtml(title || '未命名文章')
  // 仅当正文含公式（KaTeX 输出带 .katex class）时注入公式样式，避免无谓体积
  const katexStyle = html.includes('katex')
    ? KATEX_CSS
      ? `<style>${KATEX_CSS}</style>`
      : `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_CSS_VERSION}/dist/katex.min.css">`
    : ''
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle} - MarkFlow 预览</title>
${katexStyle}
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
