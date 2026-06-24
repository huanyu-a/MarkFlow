/**
 * CodeBlock_DA01 - 代码块组件（默认A型01号样式）
 *
 * 围栏语法 + 行内标注：
 *   ```js{1,3-5}          — 括号内数字高亮指定行
 *   // [!code highlight]  — 高亮当前行（黄色）
 *   // [!code focus]      — 聚焦当前行（其他行变暗）
 *   // [!code ++]         — 新增行（绿色）
 *   // [!code --]         — 删除行（红色）
 *   // [!code error]      — 错误行（红色错误）
 *   // [!code warning]    — 警告行（橙色）
 *   // [!code word:xxx]   — 高亮行内单词
 *
 * 语言后加 line-numbers 启用行号显示。
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { renderCodeBlock } from '@engine/utils/codeBlock'
import { radius, spacing } from '@engine/tokens'

export const CodeBlock_DA01 = {
  id: 'CodeBlock_DA01',
  name: '代码块',
  tag: 'code-block',
  description: '围栏代码块，支持 [!code highlight/focus/++/--/error/warning] 行级标注',
  attrs: [
    { key: 'lang', label: '语言', required: false, default: 'js', options: ['js', 'ts', 'python', 'css', 'html', 'bash', 'json', 'md'] },
    { key: 'title', label: '标题', required: false, default: '' },
    { key: 'lineNumbers', label: '行号', required: false, default: 'false', options: ['false', 'true'] },
    { key: 'annotation', label: '行级标注（在行末添加）', required: false, default: '', options: [
      '',
      '[!code highlight] 高亮行',
      '[!code focus] 聚焦行',
      '[!code ++] 新增行',
      '[!code --] 删除行',
      '[!code error] 错误行',
      '[!code warning] 警告行',
      '[!code word:关键词] 词高亮',
    ]},
    { key: 'highlightLines', label: '围栏高亮行号（如 2,4-5）', required: false, default: '' },
  ],
  example: `\`\`\`js{2,4-5} line-numbers
function hello(name) {
  console.log('Hello', name)        // [!code focus]
  const time = Date.now()           // [!code highlight]
  if (!name) throw new Error('no')  // [!code error]
  return { name, time }             // [!code warning]
}
\`\`\``,

  render(attrs: Record<string, string>, body: string, _t: ThemeColors): string {
    let code = body.trim()
    let lang = attrs.lang || ''

    // Extract code from ``` fences
    const codeMatch = code.match(/^```(\S*)\n([\s\S]*?)```$/)
    if (codeMatch) {
      if (!lang) lang = codeMatch[1]
      code = codeMatch[2]
    }

    const title = attrs.title || ''
    const lineNumbers = attrs.lineNumbers === 'true'

    let html = `<section style="margin:${spacing[7]} 0px;border-radius:${radius.lg};overflow:hidden">`
    if (title) {
      html += `<section style="display:flex;align-items:center;justify-content:space-between;padding:${spacing[3]} ${spacing[5]};background:#2d2d3f;border-bottom:1px solid rgba(255,255,255,0.08)">`
      html += `<span style="font-size:11px;font-weight:600;color:#a5b4fc">${title}</span>`
      html += `<span style="font-size:10px;color:#64748b">${lang || 'text'}</span>`
      html += `</section>`
    }
    html += renderCodeBlock(code, lang, { lineNumbers })
    html += `</section>`
    return html
  },
}
