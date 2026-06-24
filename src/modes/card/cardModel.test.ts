import { describe, expect, it } from 'vitest'
import { createCardModel } from './cardModel'

describe('createCardModel', () => {
  it('extracts cover metadata and caption', () => {
    const model = createCardModel(
      `---
title: 标题
summary: 摘要内容
chips: 效率|写作
---

正文第一段。`,
      '3:4',
      'xiaohongshu',
    )

    expect(model.meta.title).toBe('标题')
    expect(model.caption).toContain('摘要内容')
    expect(model.caption).toContain('#小红书')
    expect(model.caption).toContain('#效率')
  })

  it('keeps fenced code blocks on one content page block', () => {
    const model = createCardModel(
      `---
title: 代码测试
---

\`\`\`ts
const a = 1

const b = 2
\`\`\`

后续说明。`,
      '3:4',
      'xiaohongshu',
    )

    expect(model.pages[0].markdown).toContain('const b = 2')
    expect(model.pages[0].markdown).toContain('```')
  })

  it('uses 9:16 to fit more content than 3:4', () => {
    const md = `---
title: 长内容
---

${Array.from({ length: 12 }, (_, i) => `第 ${i + 1} 段内容，包含较长的说明文字，用于测试分页估算。`).join('\n\n')}`

    const short = createCardModel(md, '3:4', 'xiaohongshu')
    const tall = createCardModel(md, '9:16', 'xiaohongshu')

    expect(tall.pages.length).toBeLessThanOrEqual(short.pages.length)
  })

  it('supports explicit <page-break/> to split pages', () => {
    const model = createCardModel(
      `---
title: 物理分页测试
---

第一页内容。

<page-break/>

第二页内容。`,
      '3:4',
      'xiaohongshu',
    )

    expect(model.pages.length).toBe(2)
    expect(model.pages[0].markdown).toBe('第一页内容。')
    expect(model.pages[1].markdown).toBe('第二页内容。')
    expect(model.pages[0].markdown).not.toContain('<page-break/>')
    expect(model.pages[1].markdown).not.toContain('<page-break/>')
  })
})
