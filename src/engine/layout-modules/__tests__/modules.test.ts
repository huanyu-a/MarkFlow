import { describe, it, expect } from 'vitest'
import { parseMarkdownAsync } from '../../utils/markdownParser'
import { makeColors } from '../../composables/useTheme'
import { resolveTokens } from '../../tokens'
import { resolveThemeProfile, getThemeProfile } from '../../themes'

const t = makeColors('#27ae60', '#1e8449')
const tokens = resolveTokens(resolveThemeProfile(getThemeProfile('default')!))

/** 测试 helper：解析 markdown 并返回 html */
async function render(md: string): Promise<string> {
  return parseMarkdownAsync(md, t, 578, undefined, tokens)
}

describe('排版模块 — fields 格式', () => {
  it(':::hero 渲染开篇主视觉', async () => {
    const md = [
      ':::hero',
      'label: 深度观察',
      'title: 公众号排版的真问题',
      'subtitle: 不是好不好看，是读者读不读得完',
      'cta_text: ↓ 3 分钟，给你一个判断',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('深度观察')
    expect(html).toContain('公众号排版的真问题')
    expect(html).toContain('不是好不好看')
    expect(html).toContain('3 分钟')
    // 主题色应出现
    expect(html).toContain('#27ae60')
  })

  it(':::verdict 渲染判断强调卡', async () => {
    const md = [
      ':::verdict',
      'label: 最终判断',
      'title: 护城河不是审美，而是结构一致性',
      'body: 让读者每次打开都知道"这是 XX 的风格"。',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('最终判断')
    expect(html).toContain('护城河不是审美')
  })

  it('未闭合 :::hero 不吞掉后续内容', async () => {
    const md = ':::hero\nlabel: x\ntitle: y\n后续段落'
    const html = await render(md)
    // 未闭合应回退，不丢失后续内容
    expect(html).toContain('后续段落')
  })
})

describe('排版模块 — rows 格式', () => {
  it(':::toc 渲染阅读导航', async () => {
    const md = [
      ':::toc',
      '01 | 问题 | 读者为什么不读你的文章',
      '02 | 原理 | 排版要解决的 4 件事',
      '03 | 实战 | 选最少的模块',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('阅读导航')
    expect(html).toContain('01')
    expect(html).toContain('读者为什么不读')
  })

  it(':::faq 渲染问答列表', async () => {
    const md = [
      ':::faq',
      '这些模块只能在某个主题里用吗？ | 不是，所有主题都支持高级排版模块。',
      '需要懂设计吗？ | 不需要，照着字段填写就行。',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('这些模块只能在某个主题里用吗')
    expect(html).toContain('不需要，照着字段填写就行')
  })

  it(':::metrics 渲染核心数据行', async () => {
    const md = [
      ':::metrics',
      '付费转化率 | 23% | 比上月提升 8 个百分点 | accent',
      '平均阅读时长 | 4.2分钟 | 高于行业均值 1.8x | default',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('付费转化率')
    expect(html).toContain('23%')
    // accent 行用主题色背景渲染
    expect(html).toContain('#27ae60')
  })
})

describe('排版模块 — json_object 格式', () => {
  it(':::quote-card 渲染金句卡', async () => {
    const md = [
      ':::quote-card',
      '{"text":"结构先于风格，骨架决定气质","source":"内容设计原则"}',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('结构先于风格')
    expect(html).toContain('内容设计原则')
  })

  it(':::quote-card JSON 解析失败时优雅降级', async () => {
    const md = ':::quote-card\n{invalid json}\n:::'
    const html = await render(md)
    expect(html).toContain('JSON 解析失败')
  })

  it(':::definition 渲染术语定义', async () => {
    const md = [
      ':::definition',
      '{"term":"OKR","def":"目标与关键结果","termLabel":"术语"}',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('OKR')
    expect(html).toContain('目标与关键结果')
  })
})

describe('排版模块 — json_array 格式', () => {
  it(':::stat-row 渲染数据指标行', async () => {
    const md = [
      ':::stat-row',
      '[{"label":"完读率","value":"79%"},{"label":"制作时间","value":"35","unit":"分钟"}]',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('完读率')
    expect(html).toContain('79%')
    expect(html).toContain('35')
    expect(html).toContain('分钟')
  })

  it(':::question 渲染问答列表', async () => {
    const md = [
      ':::question',
      '[{"q":"为什么要用？","a":"因为普通 Markdown 没有视觉层级"},{"q":"需要设计吗？","a":"不需要"}]',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('为什么要用')
    expect(html).toContain('不需要')
  })
})

describe('排版模块 — markdown 格式', () => {
  it(':::callout tip 渲染提示框', async () => {
    const md = [
      ':::callout tip',
      '先用 layout list 发现模块，再用 layout show 确认字段。',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('💡')
    expect(html).toContain('先用 layout list 发现模块')
  })

  it(':::summary 渲染文章要点', async () => {
    const md = [
      ':::summary',
      '排版的本质是降低阅读决策成本',
      '每件事选 1 个模块，hero 1 个 verdict 1 个',
      ':::',
    ].join('\n')
    const html = await render(md)
    expect(html).toContain('排版的本质')
    expect(html).toContain('每件事选 1 个模块')
  })
})

describe('排版模块 — 主题色响应', () => {
  it(':::hero 在不同主题下输出不同 accent', async () => {
    const md = [
      ':::hero',
      'label: 测试',
      'title: 测试标题',
      ':::',
    ].join('\n')
    const greenTokens = resolveTokens(resolveThemeProfile(getThemeProfile('default')!))
    const redTokens = resolveTokens(resolveThemeProfile(getThemeProfile('bytedance')!))
    const greenT = makeColors('#27ae60', '#1e8449')
    const redT = makeColors('#3350ff', '#1e3afa')
    const greenHtml = await parseMarkdownAsync(md, greenT, 578, undefined, greenTokens)
    const redHtml = await parseMarkdownAsync(md, redT, 578, undefined, redTokens)
    expect(greenHtml).toContain('#27ae60')
    expect(redHtml).toContain('#3350ff')
    expect(greenHtml).not.toContain('#3350ff')
  })
})
