/**
 * CodeBlock_DA01 - 代码块组件（默认A型01号样式）
 *
 * 统一语法（::: 容器）：
 *   :::code-block lang="js" title="示例" line-numbers
 *   ```js{2,4-5}
 *   function hello(name) {
 *     console.log('Hello', name)
 *   }
 *   ```
 *   :::
 *
 * 围栏语法 + 行内标注：
 *   ```js{1,3-5}          — 括号内数字高亮指定行
 *   // [!code highlight]  — 高亮当前行（黄色）
 *   // [!code focus]      — 聚焦当前行（其他行变暗）
 *   // [!code ++]         — 新增行（绿色）
 *   // [!code --]         — 删除行（红色）
 *
 * 属性：
 *   lang         - 语言（js/ts/python/css/html/bash/json/md）
 *   title        - 标题
 *   line-numbers - 启用行号（写任意值即启用）
 */
import { renderCodeBlock } from '@engine/utils/codeBlock'
import { radius, spacing } from '@engine/tokens'
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef } from './unifiedRender'

export const CodeBlock_DA01: UnifiedComponentDef = {
  spec: {
    name: 'code-block',
    label: '代码块',
    bodyFormat: 'markdown',
    example: `:::code-block lang="js" title="示例" line-numbers
\`\`\`js{2,4-5}
function hello(name) {
  console.log('Hello', name)        // [!code focus]
  const time = Date.now()           // [!code highlight]
  if (!name) throw new Error('no')  // [!code error]
  return { name, time }             // [!code warning]
}
\`\`\`
:::`,
    fields: [
      { name: 'lang', required: false, description: '语言（js/ts/python/css/html/bash/json/md）' },
      { name: 'title', required: false, description: '标题' },
      { name: 'line-numbers', required: false, description: '启用行号' },
    ],
  },

  render(attrs, _rawBody, body, _t) {
    let code = body.markdown.trim()
    let lang = attrs.lang || ''
    const codeMatch = code.match(/^```(\S*)\n([\s\S]*?)```$/)
    if (codeMatch) {
      if (!lang) lang = codeMatch[1]
      code = codeMatch[2]
    }
    const title = attrs.title || ''
    const lineNumbers = attrs['line-numbers'] === 'true' || attrs['line-numbers'] === ''

    let html = `<section style="margin:${spacing[7]} 0px;border-radius:${radius.lg};overflow:hidden">`
    if (title) {
      html += `<section style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#2d2d3f;border-bottom:1px solid rgba(255,255,255,0.08)">`
      html += `<span style="font-size:11px;font-weight:600;color:#a5b4fc">${title}</span>`
      html += `<span style="font-size:10px;color:#64748b">${lang || 'text'}</span>`
      html += `</section>`
    }
    html += renderCodeBlock(code, lang, { lineNumbers })
    html += `</section>`
    return html
  },

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const codeBlockRenderer = buildUnifiedRenderer(CodeBlock_DA01)
