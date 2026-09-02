/**
 * 全组件渲染冒烟测试
 *
 * 覆盖三类组件的真实渲染管线（parseMarkdown 完整调度）：
 *   A. layout-modules 全部 ::: 排版模块（示例取自 extension/data.ts 的 LAYOUT_EXAMPLES）
 *   B. editor-components 全部 ::: 统一组件（示例取自各组件 spec.example）
 *   C. <tag> 标签组件与用户实际使用语法（含 regression 用例）
 *
 * 断言契约：
 *   1. 内容不丢失：示例中的代表性文本必须出现在输出 HTML 中
 *   2. 语法不残留：输出不得含未处理的 ':::' 或字面 '**'（示例含加粗时）
 *   3. 无转义残渣：不得出现 &lt;step 等被当文本渲染的标签碎片
 */
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './markdownParser'
import { makeColors } from '../index'
import { layoutModuleSpecs } from '../layout-modules'
import { LAYOUT_EXAMPLES, fallbackExample } from '@/components/extension/data'
import { Steps_DA01 } from '../editor-components/Steps_DA01'
import { Steps_DA02 } from '../editor-components/Steps_DA02'
import { Timeline_DA01 } from '../editor-components/Timeline_DA01'
import { Breaking_DA01 } from '../editor-components/Breaking_DA01'
import { GovHeader_DA01 } from '../editor-components/GovHeader_DA01'
import { ReadingPath_DA01 } from '../editor-components/ReadingPath_DA01'
import { Align_DA01 } from '../editor-components/Align_DA01'
import { Slider_DA01 } from '../editor-components/Slider_DA01'
import { LabeledFlow_DA01 } from '../editor-components/LabeledFlow_DA01'
import { Callout_DA01 } from '../editor-components/Callout_DA01'
import { CodeBlock_DA01 } from '../editor-components/CodeBlock_DA01'
import { Table_DA01 } from '../editor-components/Table_DA01'
import { HintContainer_DA01 } from '../editor-components/HintContainer_DA01'
import type { UnifiedComponentDef } from '../editor-components/unifiedRender'

const COLORS = makeColors('#27ae60', '#1e8449')
const render = (md: string) => parseMarkdown(md, COLORS)

/** 从示例文本中提取一个「纯中文连续片段」作为内容探针（不受 pangu/空格影响） */
function cjkNeedle(text: string): string | null {
  const runs = text.match(/[\u4e00-\u9fa5]{4,}/g)
  if (!runs || runs.length === 0) return null
  // 选最长的中文片段，最具区分度
  return runs.sort((a, b) => b.length - a.length)[0]
}

/** 从 layout 模块示例中按 bodyFormat 提取内容探针 */
function exampleNeedle(example: string, bodyFormat: string): string | null {
  const text = example.trim()
  if (!text) return null
  if (bodyFormat === 'json_object' || bodyFormat === 'json_array') {
    return cjkNeedle(text)
  }
  const firstLine = text.split('\n').find((l) => l.trim()) ?? ''
  if (bodyFormat === 'rows') return cjkNeedle(firstLine)
  if (bodyFormat === 'fields') {
    const value = firstLine.replace(/^[^:]*:\s*/, '')
    return cjkNeedle(value) ?? cjkNeedle(text)
  }
  // markdown：跳过围栏与容器标记行
  const contentLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('```') && !/^:::/.test(l) && !l.startsWith('|'))
  return cjkNeedle(contentLine ?? text) ?? cjkNeedle(text)
}

/** 通用断言：内容可见、语法不残留 */
function expectRendered(
  html: string,
  needle: string | null,
  opts?: { hasBold?: boolean; allowTripleColon?: boolean },
) {
  expect(html.length).toBeGreaterThan(20)
  if (needle) expect(html).toContain(needle)
  if (!opts?.allowTripleColon) expect(html).not.toContain(':::')
  if (opts?.hasBold) expect(html).not.toContain('**')
  expect(html).not.toMatch(/&lt;\/?(step|title|section|div|p)\b/)
}

// ── A. layout-modules 全部排版模块 ────────────────────────────

describe('layout-modules 全组件渲染', () => {
  it.each(layoutModuleSpecs.map((s) => [s.name, s.bodyFormat] as const))(
    ':::%s 渲染正确',
    (name, bodyFormat) => {
      const example = LAYOUT_EXAMPLES[name] ?? fallbackExample(bodyFormat)
      const md = `:::${name}\n${example}\n:::`
      const html = render(md)
      expectRendered(html, exampleNeedle(example, bodyFormat), {
        hasBold: example.includes('**'),
        // 示例正文本身合法包含 :::（如 question 的答案文本），此时无法用该断言区分残留
        allowTripleColon: example.includes(':::'),
      })
    },
  )

  it('排版模块清单非空（防止注册表被清空后测试空转）', () => {
    expect(layoutModuleSpecs.length).toBeGreaterThanOrEqual(30)
  })
})

// ── B. editor-components 全部统一 ::: 组件 ─────────────────────

const UNIFIED_DEFS: UnifiedComponentDef[] = [
  Steps_DA01,
  Steps_DA02,
  Timeline_DA01,
  Breaking_DA01,
  GovHeader_DA01,
  ReadingPath_DA01,
  Align_DA01,
  Slider_DA01,
  LabeledFlow_DA01,
  Callout_DA01,
  CodeBlock_DA01,
  Table_DA01,
  HintContainer_DA01,
]

describe('editor-components 统一 ::: 组件渲染', () => {
  it.each(UNIFIED_DEFS.map((d) => [d.spec.name] as const))(
    ':::%s 官方示例渲染正确',
    (name) => {
      const def = UNIFIED_DEFS.find((d) => d.spec.name === name)!
      const example = def.spec.example
      // reading-path 官方示例依赖文档结构，前置两个 level1 章节标题
      const md = name === 'reading-path' ? '<p-title num="01" title="问题定义" subtitle="P1" level="1"></p-title>\n<p-title num="02" title="行动指南" subtitle="P2" level="1"></p-title>\n' + example : example
      const html = render(md)
      // reading-path 只渲染节点标题列（不渲染描述列），探针取首个标题
      const needle = name === 'reading-path' ? '问题定义' : exampleNeedle(example, def.spec.bodyFormat)
      expectRendered(html, needle, {
        hasBold: example.includes('**'),
        allowTripleColon: example.includes(':::'),
      })
    },
  )
})

// ── C. 标签组件与用户实际语法 ─────────────────────────────────

describe('标签组件渲染', () => {
  const TAG_CASES: Array<{ name: string; md: string; needles: string[]; hasBold?: boolean }> = [
    {
      name: '<title> DA01/DA02',
      md: '<title>文档主标题甲</title>\n\n<title type="DA02">章节标题乙</title>',
      needles: ['文档主标题甲', '章节标题乙'],
    },
    {
      name: '<p-title>',
      md: '<p-title num="01" title="章节标题丙" subtitle="SECTION" level="1"></p-title>',
      needles: ['章节标题丙'],
    },
    {
      name: '<statement>',
      md: '<statement>长图文的关键不是装饰更多，而是让读者更快理解重点。</statement>',
      needles: ['长图文的关键不是装饰更多'],
    },
    {
      name: '<badges>',
      md: '<badges tone="accent">产品介绍|教程文章|运营复盘</badges>',
      needles: ['产品介绍', '运营复盘'],
    },
    {
      name: '<lead> 标签与 ::: 容器',
      md: '<lead>\n导语标签内容丁，用于文章开头建立预期。\n</lead>\n\n:::lead\n导语容器内容戊，用于文章开头建立预期。\n:::',
      needles: ['导语标签内容丁', '导语容器内容戊'],
    },
    {
      name: '<breaking> 标签',
      md: '<breaking badge="重磅" title="重磅标题己" subtitle="副标题己">导语内容己</breaking>',
      needles: ['重磅标题己', '导语内容己'],
    },
    {
      name: '<cta> 自闭合',
      md: '<cta label="NEXT STEP" title="行动标题庚" button="立即开始"></cta>',
      needles: ['行动标题庚'],
    },
    {
      name: '<engage>',
      md: '<engage type="DA02" title="感谢阅读辛" subtitle="继续探索更多内容。" color="green"></engage>',
      needles: ['感谢阅读辛'],
    },
    {
      name: '<img>',
      md: '<img src="https://robocopmao.github.io/r-markdown/banner4.webp" alt="架构图壬" />',
      needles: ['banner4.webp'],
    },
    {
      name: '<align>',
      md: '<align align="center">居中文字子</align>',
      needles: ['居中文字子'],
    },
    {
      name: '<timeline> 标签',
      md: '<timeline>\n- 2024年01月 | 事件丑 | 描述丑详情\n- 2025年01月 | 事件寅 | 描述寅详情\n</timeline>',
      needles: ['事件丑', '事件寅'],
    },
    {
      name: '<case-flow> 标签',
      md: '<case-flow color="#e74c3c">\n- [案例 01] 案例内容卯\n- [案例 02] 案例内容辰\n</case-flow>',
      needles: ['案例内容卯', '案例内容辰'],
    },
    {
      name: '> [!TIP] callout',
      md: '> [!TIP] 操作提示巳\n> 这是提示正文内容。',
      needles: ['操作提示巳', '这是提示正文内容'],
    },
    {
      name: '标准 Markdown 基础块',
      md: '## 小节标题午\n\n普通段落正文未。\n\n- 列表项申\n\n1. 有序项酉\n\n| 列A | 列B |\n| --- | --- |\n| 甲一 | 乙二 |',
      needles: ['小节标题午', '普通段落正文未', '列表项申', '有序项酉', '甲一'],
    },
  ]

  it.each(TAG_CASES.map((c) => [c.name, c] as const))('%s', (_name, { md, needles, hasBold }) => {
    const html = render(md)
    expectRendered(html, needles[0])
    for (const n of needles) expect(html).toContain(n)
    if (hasBold) expect(html).not.toContain('**')
  })
})

// ── D. 回归：用户上报的真实用法 ───────────────────────────────

describe('用户上报用法回归', () => {
  it('<steps> 支持 <step title desc/> XML 子标签语法（截图问题 1）', () => {
    const md = `<steps type="DA01">
<step title="打开公众号" desc="找到你正在看的这个号"></step>
<step title="后台回复" desc="发送关键词「API」"></step>
<step title="查收资料" desc="地址、密钥、调用方式一次性发给你"></step>
</steps>`
    const html = render(md)
    // 不得把 <step ...> 原样注入（leaf 不转义，注入后浏览器解析为不可见未知元素）
    expect(html).not.toContain('<step')
    expect(html).not.toContain('&lt;step')
    expect(html).toContain('打开公众号')
    expect(html).toContain('找到你正在看的这个号')
    expect(html).toContain('后台回复')
    expect(html).toContain('查收资料')
  })

  it('<steps> 无 type 时按行数自动切换布局，XML 子标签同样生效', () => {
    const md = `<steps>
<step title="步骤一" desc="描述一"></step>
<step title="步骤二" desc="描述二"></step>
<step title="步骤三" desc="描述三"></step>
<step title="步骤四" desc="描述四"></step>
</steps>`
    const html = render(md)
    expect(html).not.toContain('<step')
    expect(html).toContain('步骤一')
    expect(html).toContain('步骤四')
  })

  it('<steps> 支持自闭合 <step ... /> 写法', () => {
    const md = `<steps type="DA01">
<step title="自闭合甲" desc="描述甲" />
<step title="自闭合乙" desc="描述乙" />
</steps>`
    const html = render(md)
    expect(html).not.toContain('<step')
    expect(html).toContain('自闭合甲')
    expect(html).toContain('自闭合乙')
  })

  it('<steps> 行内语法（- 名称 | 描述）保持兼容', () => {
    const md = `<steps label="HOW IT WORKS" title="从草稿到发布" active="3">
- 写作 | 在 Markdown 中完成正文
- 增强 | 使用扩展组件突出路径
- 预览 | 在右侧检查渲染效果
- 交付 | 复制富文本到公众号
</steps>`
    const html = render(md)
    expect(html).toContain('从草稿到发布')
    expect(html).toContain('在 Markdown 中完成正文')
    expect(html).toContain('复制富文本到公众号')
  })

  it('行内标签条目 - [N] 解析行内 markdown 加粗（截图问题 2）', () => {
    const md = `- [1] **自己用就好，别往外发** — 额度不多，省着点用
- [2] **正常调用，别搞事** — 批量刷、恶意并发这些别干，这是大家共用的
- [3] **用模型就行，别动服务器** — 这条不用多说了吧`
    const html = render(md)
    expect(html).toContain('自己用就好，别往外发')
    expect(html).not.toContain('**')
  })

  it('任务清单 - [ ] / - [x] 不被行内标签条目误捕获', () => {
    const md = `- [ ] 待办任务甲
- [x] 已完成任务乙`
    const html = render(md)
    expect(html).toContain('待办任务甲')
    expect(html).toContain('已完成任务乙')
    // 任务清单应渲染复选框图形，而不是卡片式标签条
    expect(html).toContain('<svg')
  })
})
