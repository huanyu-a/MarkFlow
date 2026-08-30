import { EditorView } from '@codemirror/view'
import { tagMap } from '@engine'

// 标签检测：检测选中文本是否为组件标签 / ::: 容器 / 代码块
export function tagDetection(onTagDetected: ((tag: string, from: number, to: number) => void) | null) {
  if (!onTagDetected) return []
  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet) return
    const { from, to } = update.state.selection.main
    if (from === to) {
      onTagDetected('', 0, 0)
      return
    }
    const selected = update.state.doc.sliceString(from, to).trim()
    // <tag> 语法
    const tagMatch = selected.match(/^<\/?([A-Za-z_][\w.-]*)/)
    if (tagMatch) {
      const tagName = tagMatch[1]
      if (tagMap[tagName]) {
        onTagDetected(tagName, from, to)
        return
      }
    }
    // ::: container 语法 — 扩展选区到完整容器
    const containerMatch = selected.match(/^:{3,4}\s*(tip|note|info|warning|caution|important|table)\b/)
    if (containerMatch) {
      const type = containerMatch[1]
      const tag = type === 'table' ? 'table' : 'hint'
      if (tagMap[tag]) {
        // 向前向后搜索完整容器范围
        const fullDoc = update.state.doc.toString()
        const colons = containerMatch[0].match(/^(:{3,4})/)![1]
        const closeRe = new RegExp(`^${colons}\\s*$`, 'm')
        const expandFrom = from
        let expandTo = to
        // 向前搜索闭合 :::
        const closeMatch = fullDoc.substring(from).match(closeRe)
        if (closeMatch && closeMatch.index !== undefined) {
          const closePos = from + closeMatch.index + closeMatch[0].length
          // 跳过闭合行后的 footer 行
          const afterClose = fullDoc.substring(closePos)
          const footerMatch = afterClose.match(/^[^\n]+\n?/)
          const footerLen = (footerMatch && !footerMatch[0].startsWith(':::') && !footerMatch[0].includes('|')) ? footerMatch[0].length : 0
          expandTo = closePos + footerLen
        }
        onTagDetected(tag, expandFrom, expandTo)
        return
      }
    }
    // ``` 代码块语法 — 扩展选区到完整围栏
    const fenceMatch = selected.match(/^```(\w*)/)
    if (fenceMatch) {
      if (tagMap['code-block']) {
        const fullDoc = update.state.doc.toString()
        const closeFence = fullDoc.indexOf('\n```', from + 3)
        if (closeFence > 0) {
          // 找到闭合 ``` 后的换行
          const end = fullDoc.indexOf('\n', closeFence + 4)
          const expandTo = end > 0 ? end : closeFence + 4
          onTagDetected('code-block', from, expandTo)
        } else {
          onTagDetected('code-block', from, to)
        }
        return
      }
    }
    onTagDetected('', 0, 0)
  })
}
