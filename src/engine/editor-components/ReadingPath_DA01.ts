/**
 * ReadingPath_DA01 - 阅读路线导航
 *
 * 统一语法（::: 容器）：
 *   :::reading-path
 *   :::
 *
 * 自动从文档的 h2 标题中提取章节列表，渲染为横向导航卡片。
 * 实际渲染由 blockRenderRegistry 的 readingPathRenderer 处理（用 pTitleLevel1List），
 * 组件本身 render 返回空字符串。
 *
 * 示例中提供 mock 章节数据供组件库预览展示。
 */
import { buildUnifiedRenderer, parseBody, type UnifiedComponentDef } from './unifiedRender'
import { radius, spacing } from '@engine/tokens'
import { leaf } from '@engine/utils/helpers'
export const ReadingPath_DA01: UnifiedComponentDef = {
  spec: {
    name: 'reading-path',
    label: '阅读路线',
    bodyFormat: 'markdown',
    example: `:::reading-path
- 问题定义 | 为什么现有排版让读者在 3 秒内离开，数据背后的认知科学原理
- 模块原理 | 43 个排版模块各自解决什么场景问题，从开篇到结尾全覆盖
- 实战示例 | 一篇观点文从空白草稿到发布成品的完整排版过程拆解
- 主题系统 | 48 套专业配色方案，一键切换品牌气质，无需设计背景
- 行动指南 | 今天就能上手的 3 步方法：选模块 → 填内容 → 复制发布
:::`,
    fields: [],
  },

  render(_attrs, rawBody, body, t): string {
    // 组件库预览：从 body 提取 mock 渲染
    const chapters = (body.markdown || rawBody)
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- '))
      .map((l) => l.slice(2).split('|').map((x) => x.trim()))
      .filter((r) => r[0])

    if (chapters.length < 2) return ''

    let html = `<section style="margin:0px 0px ${spacing[12]}"><section>`
    html += `<section style="display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:${spacing[6]};gap:${spacing[5]}"><section style="flex-shrink:0"><p style="margin:0px;padding:0px 0px ${spacing[2]};font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2.8px;font-weight:800;white-space:nowrap">READING PATH</p><p style="margin:0px;font-size:16px;line-height:1.35;color:#1a1a1a;font-weight:700">阅读路线</p></section><p style="margin:0px;font-size:11px;color:#94a3b8;white-space:nowrap">${chapters.length} 个章节</p></section>`
    html += `<section style="padding:${spacing[6]} ${spacing[5]} ${spacing[5]};border:1px solid #e2e8f0;border-radius:${radius['3xl']};background:linear-gradient(white 0%,#f8fafc 100%);overflow-x:auto;white-space:nowrap;font-size:0px">`
    chapters.forEach((ch, idx) => {
      const num = String(idx + 1).padStart(2, '0')
      const isActive = idx === 0
      html += `<section style="display:inline-flex;vertical-align:middle;align-items:center">`
      html += `<section style="display:inline-block;vertical-align:top;width:126px;white-space:normal;text-align:center">`
      html += `<section style="display:flex;justify-content:center;margin-bottom:${spacing[4]}">`
      html += `<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${isActive ? t.accent : 'white'};color:${isActive ? 'white' : t.accent};border:1px solid ${isActive ? t.accent : '#dbe3ee'};font-size:12px;font-weight:900">${num}</span>`
      html += `</section>`
      html += `<p style="margin:0px;font-size:13px;line-height:1.55;color:${isActive ? '#1a1a1a' : '#334155'};font-weight:700;white-space:normal;word-break:break-all">${leaf(ch[0])}</p>`
      html += `</section>`
      if (idx < chapters.length - 1) {
        html += `<span style="display:inline-block;vertical-align:middle;width:32px;height:1px;margin:0px ${spacing[3]};background:linear-gradient(90deg,#94a3b859,#94a3b8d9);color:transparent;overflow:hidden">-</span>`
      }
      html += `</section>`
    })
    html += `</section></section></section>`
    return html
  },

  renderLegacy(attrs, body, t) {
    return this.render(attrs, body, parseBody(body, this.spec.bodyFormat), t)
  },
}

export const readingPathRenderer = buildUnifiedRenderer(ReadingPath_DA01)
