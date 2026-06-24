import type { ThemeColors } from '@engine/composables/useTheme'

/**
 * Reading Path - 阅读路线导航
 *
 * 编辑器语法：
 *   <reading-path></reading-path>
 *
 * 自动从文档的 h2 标题中提取章节列表，渲染为横向导航卡片。
 * 需要在 markdownParser 中先收集 h2List，再传入 render。
 */

// ── 组件定义 ──────────────────────────────────────────
export const ReadingPath_DA01 = {
  id: 'ReadingPath_DA01',
  name: '阅读路线',
  tag: 'reading-path',
  attrs: [],

  render(_attrs: Record<string, string>, _body: string, _t: ThemeColors, ..._rest: unknown[]): string {
    return ''
  },
}
