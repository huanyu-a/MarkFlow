import { describe, it, expect } from 'vitest'
import { splitMarkdownBlocks, mergeCaptionBlocks } from './splitBlocks'
import { classifyBlock } from './classifyBlock'

describe('splitMarkdownBlocks', () => {
  it('splits markdown by empty lines into blocks', () => {
    const md = '第一段\n\n第二段'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toEqual(['第一段', '第二段'])
  })

  it('returns empty array for empty input', () => {
    expect(splitMarkdownBlocks('')).toEqual([])
    expect(splitMarkdownBlocks('   ')).toEqual([])
  })

  it('treats consecutive non-empty lines as one block', () => {
    const md = '第一行\n第二行\n第三行'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toEqual(['第一行\n第二行\n第三行'])
  })

  it('normalizes \\r\\n to \\n', () => {
    const md = '段落一\r\n\r\n段落二'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toEqual(['段落一', '段落二'])
  })

  it('trims trailing whitespace from input', () => {
    const md = '段落一\n\n段落二   \n   '
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toEqual(['段落一', '段落二'])
  })

  it('keeps code fences as a single block', () => {
    const md = '```js\nconst x = 1;\nconst y = 2;\n```'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toContain('```js')
    expect(blocks[0]).toContain('const x = 1;')
    expect(blocks[0]).toContain('```')
  })

  it('does not split on empty lines inside code fences', () => {
    const md = '```\ncode line 1\n\ncode line 2\n```'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toContain('code line 1')
    expect(blocks[0]).toContain('code line 2')
  })

  it('handles page-break tags as separate blocks', () => {
    const md = '第一段\n\n<page-break />\n\n第二段'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toContain('第一段')
    expect(blocks).toContain('<page-break />')
    expect(blocks).toContain('第二段')
  })

  it('splits unordered list items into individual blocks', () => {
    const md = '- 项目一\n- 项目二\n- 项目三'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toBe('- 项目一')
    expect(blocks[1]).toBe('- 项目二')
    expect(blocks[2]).toBe('- 项目三')
  })

  it('splits ordered list items into individual blocks', () => {
    const md = '1. 第一步\n2. 第二步'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toBe('1. 第一步')
    expect(blocks[1]).toBe('2. 第二步')
  })

  it('keeps multi-line list items together', () => {
    const md = '- 项目一\n  子内容\n- 项目二'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toContain('项目一')
    expect(blocks[0]).toContain('子内容')
  })

  it('treats --- as rule not a list', () => {
    const md = '段落一\n\n---\n\n段落二'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toContain('---')
    expect(blocks).toContain('段落一')
    expect(blocks).toContain('段落二')
  })

  it('handles open custom tags without closing on same line', () => {
    const md = '<callout type="info">\n这是内容\n</callout>'
    const blocks = splitMarkdownBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toContain('<callout')
    expect(blocks[0]).toContain('</callout>')
  })
})

describe('mergeCaptionBlocks', () => {
  it('merges table caption followed by table block', () => {
    const blocks = ['**表 1: 数据统计**\n', '| col1 | col2 |\n| --- | --- |\n| a | b |']
    const merged = mergeCaptionBlocks(blocks)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toContain('表 1')
    expect(merged[0]).toContain('| col1 | col2 |')
  })

  it('merges image block followed by figure caption', () => {
    const blocks = ['![img](url)', '图 1: 这是图片题注']
    const merged = mergeCaptionBlocks(blocks)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toContain('![img](url)')
    expect(merged[0]).toContain('图 1')
  })

  it('does not merge unrelated blocks', () => {
    const blocks = ['普通段落', '另一个段落']
    const merged = mergeCaptionBlocks(blocks)
    expect(merged).toEqual(['普通段落', '另一个段落'])
  })

  it('does not merge table caption without a following table', () => {
    const blocks = ['表 1: 标题', '普通段落']
    const merged = mergeCaptionBlocks(blocks)
    expect(merged).toHaveLength(2)
  })
})

describe('classifyBlock', () => {
  it('classifies h1 heading', () => {
    expect(classifyBlock('# 标题')).toBe('heading')
  })

  it('classifies h2 heading', () => {
    expect(classifyBlock('## 二级标题')).toBe('heading')
  })

  it('classifies h3 heading', () => {
    expect(classifyBlock('### 三级标题')).toBe('heading')
  })

  it('classifies h4 heading', () => {
    expect(classifyBlock('#### 四级标题')).toBe('heading')
  })

  it('classifies <title> tag as heading', () => {
    expect(classifyBlock('<title>标题</title>')).toBe('heading')
  })

  it('classifies <p-title> tag as heading', () => {
    expect(classifyBlock('<p-title>副标题</p-title>')).toBe('heading')
  })

  it('classifies plain text as paragraph', () => {
    expect(classifyBlock('这是一段普通文本')).toBe('paragraph')
  })

  it('classifies unordered list', () => {
    expect(classifyBlock('- 列表项')).toBe('list')
    expect(classifyBlock('* 列表项')).toBe('list')
    expect(classifyBlock('+ 列表项')).toBe('list')
  })

  it('classifies ordered list', () => {
    expect(classifyBlock('1. 第一项')).toBe('list')
    expect(classifyBlock('9. 第九项')).toBe('list')
  })

  it('classifies code fence', () => {
    expect(classifyBlock('```js\ncode\n```')).toBe('code')
  })

  it('classifies mermaid code fence', () => {
    expect(classifyBlock('```mermaid\nflowchart LR\n  A --> B\n```')).toBe('mermaid')
  })

  it('classifies blockquote', () => {
    expect(classifyBlock('> 引用文字')).toBe('quote')
  })

  it('classifies image', () => {
    expect(classifyBlock('![alt](url)')).toBe('image')
  })

  it('classifies horizontal rule', () => {
    expect(classifyBlock('---')).toBe('rule')
  })

  it('classifies pagebreak', () => {
    expect(classifyBlock('<page-break />')).toBe('pagebreak')
    expect(classifyBlock('<page-break/>')).toBe('pagebreak')
  })

  it('classifies table', () => {
    const table = '| a | b |\n| --- | --- |\n| 1 | 2 |'
    expect(classifyBlock(table)).toBe('table')
  })

  it('classifies custom component tag', () => {
    expect(classifyBlock('<callout type="info">内容</callout>')).toBe('component')
  })
})
