import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view'
import type { ViewUpdate, DecorationSet } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

// ─── Base64 折叠插件 ───
export class Base64Placeholder extends WidgetType {
  constructor(readonly hidden: string) { super(); }
  toDOM() {
    const wrap = document.createElement('span')
    wrap.style.cssText =
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:0.92em;color:#c084fc;background:rgba(192,132,252,0.08);padding:2px 6px;border-radius:3px;border:1px dashed rgba(192,132,252,0.25);cursor:pointer;'
    wrap.textContent = '(Base64 image)'
    wrap.title = '点击展开 / 折叠'
    return wrap
  }
  eq(other: Base64Placeholder) { return this.hidden === other.hidden }
}

const placeholderField = Decoration.mark({
  class: 'cm-base64-fold',
  inclusive: true,
  attributes: { style: 'background:rgba(192,132,252,0.06);border-radius:3px;' },
})

export function collapseBase64() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      folded: { from: number; to: number } | null = null
      constructor(view: EditorView) {
        this.decorations = this.buildDeco(view)
      }
      update(u: ViewUpdate) {
        if (u.docChanged) this.decorations = this.buildDeco(u.view)
      }
      buildDeco(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()
        const re = /!\[[^\]]*\]\(data:[^)]+\)/g
        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)
          let m: RegExpExecArray | null
          while ((m = re.exec(text))) {
            const start = from + m.index
            const end = from + m.index + m[0].length
            if (this.folded && this.folded.from === start && this.folded.to === end) {
              builder.add(start, end, Decoration.replace({ widget: new Base64Placeholder(m[0]), inclusive: true }))
            } else {
              builder.add(start, end, placeholderField)
            }
          }
        }
        return builder.finish()
      }
      toggle(view: EditorView, pos: number) {
        const line = view.state.doc.lineAt(pos)
        const m = line.text.match(/!\[[^\]]*\]\(data:[^)]+\)/)
        if (!m) return false
        const start = line.from + line.text.indexOf(m[0])
        const end = start + m[0].length
        if (this.folded && this.folded.from === start && this.folded.to === end) {
          this.folded = null
        } else {
          this.folded = { from: start, to: end }
        }
        this.decorations = this.buildDeco(view)
        return true
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        click(this: any, e: PointerEvent, view: EditorView) {
          const target = e.target as HTMLElement
          const isFolded = this.folded != null
          if (target.closest('.cm-base64-fold') || isFolded) {
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }, false)
            if (pos != null) {
              this.toggle(view, pos)
              return true
            }
          }
          return false
        },
      },
    },
  )
}
