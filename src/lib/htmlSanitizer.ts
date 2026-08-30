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
    const cleanCss = processCss(el.textContent || '')
    // SVG 内部的 <style>（mermaid 图表依赖）需保持 SVG 命名空间
    const newStyle = isSvgContext
      ? ownerDoc.createElementNS(SVG_NS, 'style')
      : ownerDoc.createElement('style')
    newStyle.textContent = cleanCss
    return newStyle
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

  const target = newEl.getAttribute('target') || ''
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
