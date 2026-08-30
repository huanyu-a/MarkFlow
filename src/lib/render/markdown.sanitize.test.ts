import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '@/lib/render/markdown'
import { sanitizeHtml } from '@/lib/htmlSanitizer'
import { makeColors } from '@/engine/composables/useTheme'

const t = makeColors('#6c5ce7', '#333')

describe('renderMarkdown 安全净化（XSS 回归）', () => {
  it('原始 <script> 被移除', () => {
    const { html } = renderMarkdown('abc <script>alert(1)</script> def', t)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
    // 正文文本保留
    expect(html).toContain('abc')
    expect(html).toContain('def')
  })

  it('img onerror 事件属性被剥离', () => {
    const { html } = renderMarkdown('前文 <img src=x onerror=alert(1)> 后文', t)
    expect(html).not.toContain('onerror')
  })

  it('svg onload 事件属性被剥离', () => {
    const { html } = renderMarkdown('<svg onload=alert(1)>', t)
    expect(html).not.toContain('onload')
  })

  it('javascript: 链接被拦截', () => {
    const { html } = renderMarkdown('<a href="javascript:alert(1)">x</a>', t)
    expect(html).not.toContain('javascript:')
  })

  it('markdown 图片中的 javascript: 协议降级为 about:blank', () => {
    const { html } = renderMarkdown('![a](javascript:alert(1))', t)
    expect(html).not.toContain('javascript:')
  })

  it('iframe 被保留时必须带 sandbox 隔离', () => {
    const { html } = renderMarkdown('<iframe src="https://evil.example"></iframe>', t)
    if (html.includes('<iframe')) {
      expect(html).toMatch(/sandbox=/)
    }
  })

  it('良性富文本 HTML 与内联样式保留（公众号场景）', () => {
    const md = '<section style="color:#e74c3c;padding:8px"><strong>加粗文字</strong><span style="font-size:14px">普通</span></section>'
    const { html } = renderMarkdown(md, t)
    expect(html).toContain('style="color:#e74c3c;padding:8px"')
    expect(html).toContain('<strong')
    expect(html).toContain('加粗文字')
  })

  it('meta refresh 重定向被移除', () => {
    const out = sanitizeHtml('<meta http-equiv="refresh" content="0;url=https://evil.example">')
    expect(out).not.toContain('refresh')
  })

  it('<base> 标签被移除（防止相对 URL 劫持）', () => {
    const out = sanitizeHtml('<base href="https://evil.example/"><p>内容</p>')
    expect(out).not.toContain('<base')
    expect(out).toContain('内容')
  })

  it('SVG xlink:href 命名空间 URL 同样受白名单约束', () => {
    const bad = sanitizeHtml('<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>')
    expect(bad).not.toContain('javascript:')
    const good = sanitizeHtml('<svg><use xlink:href="#icon-ok"></use></svg>')
    expect(good).toContain('#icon-ok')
  })

  it('快速路径混淆向量：制表符混淆的 javascript: 协议被拦截', () => {
    // URL 解析器会剥离 href 中的 tab/换行，字符串层检测需在剥离副本上兜底
    const out = sanitizeHtml('<a href="java\tscript:alert(1)">x</a>')
    expect(out).not.toMatch(/j\s*a\s*v\s*a\s*\t?\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i)
    expect(out).not.toContain('\tscript')
  })

  it('快速路径混淆向量：数字实体混淆的协议/标签被拦截', () => {
    const out = sanitizeHtml('<a href="&#106;avascript:alert(1)">x</a>')
    expect(out.toLowerCase()).not.toContain('avascript:')
    const out2 = sanitizeHtml('&#60;script&#62;alert(1)&#60;/script&#62;')
    expect(out2).not.toContain('<script')
  })

  it('无危险特征的常规内容走快速路径原样返回', () => {
    const benign = '<section style="margin:0px 0px 24px"><p style="font-size:16px">正文 <strong>加粗</strong></p></section>'
    expect(sanitizeHtml(benign)).toBe(benign)
  })

  it('mXSS：svg 内 style 的实体混淆文本不得复活为真实元素（P0 回归）', () => {
    const out = sanitizeHtml('<svg><style>&lt;img src=x onerror=alert(1)&gt;</style></svg>')
    // 关键：style 文本中的 < > 已被 CSS 转义，无法再解析为标记元素
    expect(out).not.toContain('<img')
    expect(out).toContain('\\3c ')
  })

  it('mXSS：svg 内 xmp/plaintext 等 rawtext 废弃元素被丢弃', () => {
    const out = sanitizeHtml('<svg><xmp>&lt;img src=x onerror=alert(1)&gt;</xmp></svg>')
    expect(out).not.toContain('<img')
    expect(out).not.toContain('<xmp')
  })

  it('命名实体混淆的协议被完整净化拦截', () => {
    const out = sanitizeHtml('<a href="javascript&colon;alert(1)">点我</a>')
    expect(out.toLowerCase()).not.toContain('avascript')
    const out2 = sanitizeHtml('<a href="javas&NewLine;cript&colon;alert(1)">点我</a>')
    expect(out2.toLowerCase()).not.toContain('avascript')
  })

  it('SMIL 动画元素篡改事件/URL 属性被丢弃', () => {
    const out = sanitizeHtml('<svg><circle r="50"><set attributeName="onmouseover" to="alert(1)"/></circle></svg>')
    expect(out).not.toContain('onmouseover')
    const out2 = sanitizeHtml('<svg><set attributeName="href" to="javascript:alert(1)"/></svg>')
    expect(out2).not.toContain('javascript:')
  })

  it('target=_BLANK 大小写变体同样补全 rel=noopener', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_BLANK">x</a>')
    expect(out).toMatch(/rel="noopener/i)
  })

  it('实体解码不影响快速路径：引擎自身转义产物（&#39;/&amp;）保持零开销直通', () => {
    const engineLike = '<p style="margin:0px">it&#39;s a &quot;test&quot; &amp; demo</p>'
    expect(sanitizeHtml(engineLike)).toBe(engineLike)
  })
})

describe('净化不影响可信渲染产物', () => {
  it('mermaid 纯 SVG（含内部 style/marker/path）经净化后结构保留', () => {
    // 模拟 mermaid htmlLabels:false + securityLevel:strict 的输出形态
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" id="m-diagram" viewBox="0 0 200 100" width="200" style="max-width:200px;">',
      '<style>#m-diagram{font-family:trebuchet ms;}#m-diagram .node path{fill:#ececff;}</style>',
      '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" orient="auto"><path d="M0,0 L10,5 L0,10" fill="#333"></path></marker></defs>',
      '<g class="node"><rect x="10" y="10" width="80" height="40" rx="4"></rect><text x="50" y="35">步骤</text></g>',
      '</svg>',
    ].join('')
    const out = sanitizeHtml(svg)
    expect(out).toContain('viewBox="0 0 200 100"')
    expect(out).toContain('<marker')
    expect(out).toContain('refX="9"')
    expect(out).toContain('.node path')
    expect(out).toContain('fill:#ececff')
    expect(out).toContain('<text')
    expect(out).toContain('步骤')
  })

  it('KaTeX 输出（span + MathML）经净化后保留', () => {
    const katex = [
      '<span class="katex-display"><span class="katex">',
      '<span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow></semantics></math></span>',
      '<span class="katex-html" aria-hidden="true"><span class="base"><span class="mord mathnormal">a</span><span class="mbin">+</span><span class="mord mathnormal">b</span></span></span>',
      '</span></span>',
    ].join('')
    const out = sanitizeHtml(katex)
    expect(out).toContain('katex-display')
    expect(out).toContain('<math')
    expect(out).toContain('<semantics')
    expect(out).toContain('class="mord mathnormal"')
  })

  it('普通段落渲染结果经净化后保持可见文本不变', () => {
    const { html } = renderMarkdown('# 标题\n\n正文段落，包含 **加粗** 文本。', t)
    expect(html).toContain('标题')
    expect(html).toContain('加粗')
    // 二次净化幂等
    expect(sanitizeHtml(html)).toBe(html)
  })
})
