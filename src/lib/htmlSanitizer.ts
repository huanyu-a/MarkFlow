const DANGEROUS_TAGS = new Set(['script', 'noscript', 'template'])

const URL_ATTRS = new Set(['href', 'src', 'srcset', 'poster', 'data', 'action', 'formaction'])

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

const REJECTED_PROTOCOLS = new Set([
  'javascript:',
  'vbscript:',
  'jscript:',
  'livescript:',
  'view-source:',
  'filesystem:',
  'mocha:',
])

const SAFE_DATA_MEDIA_TYPES = new Set([
  'image/',
  'font/',
  'application/json',
  'text/plain',
  'application/pdf',
])

const IFRAME_SANDBOX_WHITELIST = new Set([
  'allow-forms',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-scripts',
  'allow-downloads',
  'allow-top-navigation-by-user-activation',
])

const SAFE_LINK_RELS = new Set([
  'stylesheet',
  'icon',
  'preload',
  'preconnect',
  'dns-prefetch',
])

const SVG_NS = 'http://www.w3.org/2000/svg'

const CONTROL_CHAR_RE = /[\u0000-\u001F\s]/g

/**
 * 快速路径特征检测（宁误报不漏报）：
 * - 需特殊处理的标签：script/iframe/object/embed/meta/base/link/style/noscript/template
 *   与 SMIL 动画元素（animate/set 可用于篡改事件或 URL 属性）
 * - 事件属性：任意非单词字符后的 onXxx=（覆盖空格/换行/斜杠/引号等分隔符）
 * - 危险协议、data: 危险变体、target=_blank（需补 rel=noopener）
 * - CSS 危险模式（expression/behavior/-moz-binding/@import）
 *
 * 字符引用混淆（&#106; / &colon; / &NewLine; 等）不在此正则内，
 * 由 decodeCharRefsForScan 解码后二次检测覆盖。
 */
const UNSAFE_HINT_RE = new RegExp(
  [
    '<(?:script|iframe|object|embed|meta|base|link|style|noscript|template|animate|set|animatetransform)\\b',
    '[^\\w]on[a-z]{2,}\\s*=',
    '(?:javascript|vbscript|jscript|livescript|mocha|view-source):',
    'data:(?:text/html|application)',
    '(?:expression\\s*\\(|behavior\\s*:|-moz-binding|@import)',
    // target=_blank 需走完整净化以自动补 rel=noopener（防 reverse tabnabbing）
    'target\\s*=\\s*["\']?_blank',
    // 无分号数字实体（浏览器在属性值中无条件解码，如 &#106avascript: → javascript:）；
    // 带分号形式由 decodeCharRefsForScan 解码副本覆盖，不在此命中以保住快速路径
    '&#[xX]?[0-9a-fA-F]+(?![;0-9a-fA-F])',
    // 无分号 legacy 命名实体（amp/lt/gt/quot 无分号仍会被浏览器解码）
    '&(?:amp|lt|gt|quot|AMP|LT|GT|QUOT)(?![;a-zA-Z0-9])',
  ].join('|'),
  'i',
)

// 可解码为 ASCII 危险字符的常用命名实体（完整 HTML5 实体表过大，
// 危险模式仅可能由以下字符构成；未知实体浏览器不解码，保持字面即可）
const NAMED_ASCII_REFS: Record<string, string> = {
  amp: '&', AMP: '&', lt: '<', LT: '<', gt: '>', GT: '>', quot: '"', QUOT: '"',
  apos: "'", colon: ':', Colon: ':', semi: ';', Semi: ';', sol: '/', Sol: '/',
  bsol: '\\', num: '#', percnt: '%', excl: '!', Excl: '!', equals: '=', Equals: '=',
  quest: '?', period: '.', comma: ',', plus: '+', Plus: '+',
  lpar: '(', rpar: ')', lbrack: '[', rbrack: ']', lcub: '{', rcub: '}',
  lowbar: '_', grave: '`', ast: '*', Tab: '\t', NewLine: '\n', newline: '\n',
}

/**
 * 为快速路径检测解码字符引用（数字实体 + ASCII 标点命名实体）。
 * 仅用于检测副本，不用于输出；浏览器不解码的引用保持字面。
 */
function decodeCharRefsForScan(s: string): string {
  if (!s.includes('&')) return s
  return s.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code < 128 ? String.fromCharCode(code) : ' '
    }
    return NAMED_ASCII_REFS[body] ?? m
  })
}

/** 快速路径判定：原始串、剥控制符副本、实体解码副本任一命中即走完整净化 */
function needsFullSanitize(html: string): boolean {
  const stripped = html.replace(/[\t\n\r\f\v]/g, '')
  if (UNSAFE_HINT_RE.test(html) || UNSAFE_HINT_RE.test(stripped)) return true
  if (html.includes('&')) {
    const decoded = decodeCharRefsForScan(html)
    if (decoded !== html && (UNSAFE_HINT_RE.test(decoded) || UNSAFE_HINT_RE.test(decoded.replace(/[\t\n\r\f\v]/g, '')))) {
      return true
    }
  }
  return false
}

function isEventHandlerAttr(name: string): boolean {
  return name.startsWith('on') && name.length > 2
}

/** 取属性名的本地名（去命名空间前缀），如 xlink:href → href */
function attrLocalName(name: string): string {
  return name.split(':').pop() || name
}

function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHAR_RE, '')
}

function isDangerousUrl(value: string): boolean {
  const cleaned = stripControlChars(value).toLowerCase()
  if (!cleaned) return false
  for (const proto of REJECTED_PROTOCOLS) {
    if (cleaned.startsWith(proto)) return true
  }
  return false
}

function isSafeDataUrl(value: string): boolean {
  const cleaned = stripControlChars(value).toLowerCase()
  if (!cleaned.startsWith('data:')) return false
  const mediaPart = cleaned.slice(5).split(';')[0]
  for (const safe of SAFE_DATA_MEDIA_TYPES) {
    if (mediaPart === safe || mediaPart.startsWith(safe)) return true
  }
  return false
}

function isSafeUrl(value: string): boolean {
  if (!value) return true
  if (isDangerousUrl(value)) return false
  const cleaned = stripControlChars(value)
  if (!cleaned) return true
  if (/^(\/|#|\.\.?\/)/.test(cleaned)) return true
  if (isSafeDataUrl(cleaned)) return true
  try {
    const url = new URL(cleaned, 'http://localhost')
    return SAFE_URL_PROTOCOLS.has(url.protocol)
  } catch {
    return !/^[a-z][a-z0-9+.-]*:/i.test(cleaned)
  }
}

function isSafeSrcset(value: string): boolean {
  return value.split(',').every((part) => {
    const url = part.trim().split(/\s+/)[0]
    return !url || isSafeUrl(url)
  })
}

function processCss(value: string): string {
  let result = value
  result = result.replace(/expression\s*\(/gi, '__removed__(')
  result = result.replace(/behavior\s*:/gi, '__removed__:')
  result = result.replace(/-moz-binding\s*:/gi, '__removed__:')
  result = result.replace(/url\s*\(\s*['"]?\s*javascript:[^)]*['"]?\s*\)/gi, 'url("")')
  result = result.replace(/@import/gi, '@__removed__')
  return result
}

function sanitizeSandboxValue(value: string, allowScripts: boolean): string {
  const tokens = value
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && IFRAME_SANDBOX_WHITELIST.has(t) && t !== 'allow-same-origin')
  if (!tokens.includes('allow-forms')) {
    tokens.unshift('allow-forms')
  }
  if (allowScripts && !tokens.includes('allow-scripts')) {
    tokens.push('allow-scripts')
  }
  if (!allowScripts) {
    const idx = tokens.indexOf('allow-scripts')
    if (idx !== -1) tokens.splice(idx, 1)
  }
  return tokens.join(' ').trim()
}

function sanitizeSvg(source: Element, ownerDoc: Document, options: SanitizeOptions): Element {
  const svg = ownerDoc.createElementNS(SVG_NS, 'svg')
  for (let i = 0; i < source.attributes.length; i++) {
    const attr = source.attributes[i]
    if (!attr) continue
    const name = attr.name
    if (isEventHandlerAttr(name)) continue
    // 命名空间属性（如 xlink:href）按本地名匹配 URL 白名单，防止 javascript: 注入；
    // SVG 上下文保留属性原始大小写（viewBox/refX 等驼峰属性大小写敏感）
    if (URL_ATTRS.has(attrLocalName(name).toLowerCase()) && !isSafeUrl(attr.value)) continue
    try {
      svg.setAttribute(name, attr.value)
    } catch {
      // ignore invalid attribute names / namespaces
    }
  }
  source.childNodes.forEach((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) return
    const childEl = child as Element
    const tag = childEl.tagName.toLowerCase()
    if (tag === 'script' || tag === 'foreignobject') return
    const sanitizedChild = sanitizeNode(childEl, ownerDoc, options, true)
    if (sanitizedChild) svg.appendChild(sanitizedChild)
  })
  return svg
}

interface SanitizeOptions {
  strict: boolean
  allowScripts: boolean
}

function sanitizeNode(
  node: Node,
  ownerDoc: Document,
  options: SanitizeOptions,
  isSvgContext = false,
): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return ownerDoc.createTextNode(node.textContent || '')
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return ownerDoc.createComment(node.nodeValue || '')
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const el = node as Element
  const tagName = el.tagName.toLowerCase()

  if (DANGEROUS_TAGS.has(tagName)) {
    return null
  }

  if (options.strict && (tagName === 'iframe' || tagName === 'object' || tagName === 'embed')) {
    return null
  }

  if (tagName === 'object' || tagName === 'embed') {
    const srcAttr = tagName === 'object' ? 'data' : 'src'
    const srcValue = el.getAttribute(srcAttr) || ''
    if (!isSafeUrl(srcValue)) {
      return null
    }
    const iframe = ownerDoc.createElement('iframe')
    iframe.setAttribute('src', srcValue)
    const title = el.getAttribute('title')
    if (title) iframe.setAttribute('title', title)
    iframe.setAttribute('sandbox', sanitizeSandboxValue('', options.allowScripts))
    return iframe
  }

  if (tagName === 'iframe') {
    const newEl = ownerDoc.createElement('iframe')
    let explicitSandbox = ''
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i]
      if (!attr) continue
      const name = attr.name.toLowerCase()
      if (isEventHandlerAttr(name)) continue
      if (name === 'sandbox') {
        explicitSandbox = attr.value
        continue
      }
      if (name === 'srcdoc') {
        const sanitized = sanitizeHtmlInternal(attr.value, options)
        if (sanitized) newEl.setAttribute('srcdoc', sanitized)
        continue
      }
      if (URL_ATTRS.has(attrLocalName(name))) {
        if (!isSafeUrl(attr.value)) continue
      }
      try {
        newEl.setAttribute(name, attr.value)
      } catch { /* ignore */ }
    }
    newEl.setAttribute('sandbox', sanitizeSandboxValue(explicitSandbox, options.allowScripts))
    return newEl
  }

  if (tagName === 'svg') {
    return sanitizeSvg(el, ownerDoc, options)
  }

  if (tagName === 'style') {
    // P0 mXSS 防护：style 内容在序列化时不做实体转义（rawtext），
    // 若文本含 <img onerror=...>，经 dangerouslySetInnerHTML 再解析时会在
    // foreign content 中突破为真实 HTML 元素并执行。用 CSS 转义（\3c/\3e）
    // 语义等价地消除 < >，堵住再解析复活链。
    const cleanCss = processCss(el.textContent || '')
      .replace(/</g, '\\3c ')
      .replace(/>/g, '\\3e ')
    const newStyle = isSvgContext
      ? ownerDoc.createElementNS(SVG_NS, 'style')
      : ownerDoc.createElement('style')
    newStyle.textContent = cleanCss
    return newStyle
  }

  // xmp/noembed/noframes/plaintext 与 style 同为 rawtext 序列化元素，
  // 在 SVG 上下文中存在同款 mXSS 复活链，且无合法使用场景，直接丢弃
  if (isSvgContext && (tagName === 'xmp' || tagName === 'noembed' || tagName === 'noframes' || tagName === 'plaintext')) {
    return null
  }

  // SMIL 动画元素：attributeName 指向事件属性或 URL 属性时可篡改运行时行为。
  // 注意 SVG 元素上 getAttribute 大小写敏感，且 HTML 解析器会把 attributeName
  // 调整回驼峰拼写，需两种拼写都查。
  if (tagName === 'animate' || tagName === 'set' || tagName === 'animatetransform') {
    const attributeName = (
      el.getAttribute('attributeName') ||
      el.getAttribute('attributename') ||
      ''
    ).toLowerCase()
    const localAttr = attrLocalName(attributeName)
    if (isEventHandlerAttr(localAttr) || URL_ATTRS.has(localAttr)) {
      return null
    }
  }

  if (tagName === 'meta') {
    // meta refresh 可被用于重定向劫持，一律移除；charset 等无害 meta 保留
    const httpEquiv = (el.getAttribute('http-equiv') || '').trim().toLowerCase()
    if (httpEquiv === 'refresh') return null
  }

  if (tagName === 'base') {
    // <base> 会劫持整个文档的相对 URL 解析，一律移除
    return null
  }

  if (tagName === 'link') {
    const relRaw = el.getAttribute('rel') || ''
    const relTokens = relRaw.toLowerCase().split(/\s+/).filter(Boolean)
    const safeRels = relTokens.filter((r) => SAFE_LINK_RELS.has(r))
    if (safeRels.length === 0) {
      return null
    }
    const href = el.getAttribute('href') || ''
    if (!isSafeUrl(href)) {
      return null
    }
    const newEl = ownerDoc.createElement('link')
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i]
      if (!attr) continue
      const name = attr.name.toLowerCase()
      if (isEventHandlerAttr(name)) continue
      if (name === 'rel') {
        newEl.setAttribute('rel', safeRels.join(' '))
        continue
      }
      if (URL_ATTRS.has(attrLocalName(name))) {
        if (!isSafeUrl(attr.value)) continue
      }
      try {
        newEl.setAttribute(name, attr.value)
      } catch { /* ignore */ }
    }
    return newEl
  }

  // SVG 元素（如 clipPath/linearGradient/marker）的标签名与属性名大小写敏感，
  // HTML 解析器已把驼峰名调整正确，这里直接沿用原始大小写；HTML 元素仍用小写。
  const newEl = isSvgContext
    ? ownerDoc.createElementNS(SVG_NS, el.tagName)
    : ownerDoc.createElement(tagName)

  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i]
    if (!attr) continue
    const name = attr.name
    const lowerName = name.toLowerCase()

    if (isEventHandlerAttr(lowerName)) continue

    let value = attr.value

    if (URL_ATTRS.has(attrLocalName(lowerName))) {
      if (attrLocalName(lowerName) === 'srcset') {
        if (!isSafeSrcset(value)) continue
      } else if (!isSafeUrl(value)) {
        continue
      }
    }

    if (lowerName === 'style') {
      value = processCss(value)
    }

    try {
      newEl.setAttribute(name, value)
    } catch {
      // ignore invalid attribute names
    }
  }

  const target = (newEl.getAttribute('target') || '').toLowerCase()
  if ((tagName === 'a' || tagName === 'area') && (target === '_blank' || target === '_new')) {
    const existingRel = (newEl.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter(Boolean)
    const desired = ['noopener', 'noreferrer']
    for (const d of desired) {
      if (!existingRel.includes(d)) {
        existingRel.push(d)
      }
    }
    newEl.setAttribute('rel', existingRel.join(' '))
  }

  el.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, ownerDoc, options, isSvgContext)
    if (sanitized) newEl.appendChild(sanitized)
  })

  return newEl
}

function sanitizeHtmlInternal(html: string, options: SanitizeOptions): string {
  if (!html) return ''

  const trimmed = html.trim()
  const hasFullDocument = /^<!DOCTYPE\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)

  // 快速路径：字符串级超集检测。不含任何危险特征（危险标签、事件属性、
  // 危险协议、CSS 表达式、数字实体）时直接返回，跳过 DOMParser 往返。
  // 引擎常态产出（内联样式段落/表格/mermaid SVG/KaTeX）均无这些特征，
  // 使逐键防抖渲染的净化开销从百毫秒级降为零；检测宁误报不漏报，
  // 任何含特征的输入都会进入下方的完整 DOM 净化。
  // 双重检测：原始串 + 剥离制表/换行 + 实体解码副本（URL 解析器会剥离控制字符、
  // HTML 属性值会解码字符引用，混淆形式需在对应副本上才可检出）。
  if (!needsFullSanitize(html)) {
    return html
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  if (hasFullDocument) {
    const newHtml = doc.createElement('html')
    const newHead = doc.createElement('head')
    const newBody = doc.createElement('body')

    doc.head.childNodes.forEach((child) => {
      const sanitized = sanitizeNode(child, doc, options)
      if (sanitized) newHead.appendChild(sanitized)
    })
    doc.body.childNodes.forEach((child) => {
      const sanitized = sanitizeNode(child, doc, options)
      if (sanitized) newBody.appendChild(sanitized)
    })

    for (const el of [doc.documentElement, doc.body]) {
      const target = el === doc.documentElement ? newHtml : newBody
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i]
        if (!attr) continue
        const name = attr.name.toLowerCase()
        if (isEventHandlerAttr(name)) continue
        try {
          target.setAttribute(name, attr.value)
        } catch { /* ignore */ }
      }
    }

    newHtml.appendChild(newHead)
    newHtml.appendChild(newBody)
    return '<!DOCTYPE html>\n' + newHtml.outerHTML
  }

  // Fragment 模式：DOMParser 会把 <style>、<link> 等自动提升到 <head>，
  // 所以必须同时遍历 head 和 body，否则会丢失这些元素。
  const fragment = doc.createDocumentFragment()

  // 先处理 head 中的元素（style、link、meta 等）
  doc.head.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, doc, options)
    if (sanitized) fragment.appendChild(sanitized)
  })

  // 再处理 body 中的元素
  doc.body.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, doc, options)
    if (sanitized) fragment.appendChild(sanitized)
  })

  const wrapper = doc.createElement('div')
  wrapper.appendChild(fragment)
  return wrapper.innerHTML
}

export function sanitizeHtml(html: string, opts: { allowScripts?: boolean } = {}): string {
  return sanitizeHtmlInternal(html, { strict: false, allowScripts: !!opts.allowScripts })
}

export function sanitizeHtmlStrict(html: string): string {
  return sanitizeHtmlInternal(html, { strict: true, allowScripts: false })
}
