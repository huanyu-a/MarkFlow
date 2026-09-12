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
import { parseLangLineRanges } from './codeBlock'
import { makeColors } from '../index'
import { layoutModuleSpecs } from '../layout-modules'
import { LAYOUT_EXAMPLES, fallbackExample } from '@/components/extension/data'
import { buildLayoutSnippet } from '@/components/extension/utils'
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
      // 与组件面板「插入/复制」使用同一片段构建函数，锁定面板片段必须可渲染的契约
      const md = buildLayoutSnippet(name, example)
      const html = render(md)
      expectRendered(html, exampleNeedle(example, bodyFormat), {
        hasBold: example.includes('**'),
        // 示例正文本身合法包含 :::（如 question 的答案文本），此时无法用该断言区分残留
        allowTripleColon: example.includes(':::'),
      })
    },
  )

  it('buildLayoutSnippet 必须输出完整容器语法（组件面板插入契约）', () => {
    const snippet = buildLayoutSnippet('infographic', 'label: 读者画像')
    expect(snippet).toBe(':::infographic\nlabel: 读者画像\n:::')
    // 渲染后不得退化为普通段落
    const html = render(snippet)
    expect(html).not.toContain(':::')
    expect(html).not.toContain('label: 读者画像')
  })

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
    // 4 步无 type 必须命中 DA02 竖向布局特征（32px 圆形序号），防止切换逻辑被删后测试仍空过
    expect(html).toContain('width:32px;height:32px;border-radius:50%')
  })

  it('<steps> 显式 type="DA01" 时 4 步仍保持横向布局', () => {
    const md = `<steps type="DA01">
<step title="步骤一" desc="描述一"></step>
<step title="步骤二" desc="描述二"></step>
<step title="步骤三" desc="描述三"></step>
<step title="步骤四" desc="描述四"></step>
</steps>`
    const html = render(md)
    expect(html).toContain('<table')
    expect(html).not.toContain('width:32px;height:32px;border-radius:50%')
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

  it('行内标签条目 - [N] 渲染为卡片并解析行内 markdown 加粗（截图问题 2）', () => {
    const md = `- [1] **自己用就好，别往外发** — 额度不多，省着点用
- [2] **正常调用，别搞事** — 批量刷、恶意并发这些别干，这是大家共用的
- [3] **用模型就行，别动服务器** — 这条不用多说了吧`
    const html = render(md)
    // 必须命中 LabeledFlow 卡片式渲染，而非退化为普通列表
    expect(html).toContain('display:flex;align-items:center;gap:16px;padding:20px')
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
    expect(html).not.toContain('display:flex;align-items:center;gap:16px;padding:20px')
  })

  it('<cta> 单行自闭合支持 action 属性（guide 注入示例的写法）', () => {
    // 回归：单行 <cta> 走 parseCtaInline，此前只读 button，action 被静默丢弃
    const md = '<cta label="GET STARTED" title="准备好开始创作了吗？" action="打开组件库开始创作"></cta>'
    const html = render(md)
    expect(html).toContain('准备好开始创作了吗')
    expect(html).toContain('打开组件库开始创作')
    // 旧 button 写法继续兼容
    const mdBtn = '<cta title="按钮兼容测试" button="立即开始"></cta>'
    expect(render(mdBtn)).toContain('立即开始')
  })

  it('<cta> 容器（:::cta）同样兼容 action 属性', () => {
    // parseCtaBlock 从首行 header 读属性
    const md = ':::cta label="GET STARTED" title="容器标题" action="容器按钮文案"'
    const html = render(md + '\n:::')
    expect(html).toContain('容器标题')
    expect(html).toContain('容器按钮文案')
  })

  it('<cta> 多行标签路径兼容 action 与 button 两种属性（CTA_DA01.render）', () => {
    // 回归：多行 <cta>…</cta> 走 parseCtaTag→CTA_DA01.render，此前只读 action，button 旧写法静默丢按钮
    const htmlAction = render('<cta title="多行标题" action="多行动作按钮">\n正文补充\n</cta>')
    expect(htmlAction).toContain('多行动作按钮')
    const htmlBtn = render('<cta title="多行标题" button="多行旧按钮">\n正文补充\n</cta>')
    expect(htmlBtn).toContain('多行旧按钮')
  })

  it('<p-title> num 属性显示编号，与 reading-path 收集行为一致', () => {
    // 回归：PTitle_DA01.render 此前只读 number，num 写法正文不显示编号而阅读路线卡显示
    const html = render('<p-title num="07" title="编号一致性测试" level="1"></p-title>')
    expect(html).toContain('07')
  })

  it('<engage-card> / <engage-label> 精确路由，不再误撞 <engage 别名路径', () => {
    // 回归：engage-card/engage-label 是组件元数据真实 tag，此前无注册、落默认 DA01 且 subtitle/color 丢失
    const cardMd = '<engage-card title="感谢你阅读到这里！" subtitle="点个赞告诉我们反馈" color="#3b82f6"></engage-card>'
    const cardHtml = render(cardMd)
    expect(cardHtml).toContain('感谢你阅读到这里')
    // DA02 特征：三列图标 + 副标题独立成节（DA01 无 subtitle 渲染）
    expect(cardHtml).toContain('点个赞告诉我们反馈')
    // 5fa55a 是 DA01/默认配色，不应出现在 color="#3b82f6" 的 DA02 输出中
    expect(cardHtml).not.toContain('5fa55a')
    expect(cardHtml.toLowerCase()).toContain('#3b82f6')

    const labelMd = '<engage-label title="欢迎点赞转发给需要的朋友" label="THANKS FOR READING"></engage-label>'
    const labelHtml = render(labelMd)
    // DA01 特征：THANKS FOR READING 底部小字
    expect(labelHtml).toContain('欢迎点赞转发给需要的朋友')
    expect(labelHtml).toContain('THANKS FOR READING')

    // 别名 <engage type="DA02"> 行为不变
    const aliasHtml = render('<engage type="DA02" title="别名路由测试" subtitle="副标题保留"></engage>')
    expect(aliasHtml).toContain('别名路由测试')
    expect(aliasHtml).toContain('副标题保留')
  })

  it(':::compare 缺列行经 onWarning 上报（第五轮 N-5）', () => {
    const warnings: string[] = []
    const md = `:::compare
维度一 | A方描述 | B方描述 | accent
只有两列的行 | 缺第三列
:::`
    parseMarkdown(md, COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(warnings.some((w) => w.includes('compare') && w.includes('1 行'))).toBe(true)

    // 列数合法（3 内容列 + accent 标记）时无警告
    const okWarnings: string[] = []
    parseMarkdown(':::compare\n维度 | A | B | accent\n:::', COLORS, undefined, undefined, (w) => okWarnings.push(w))
    expect(okWarnings).toHaveLength(0)
  })

  it('<badges> 空 body 不渲染空 flex 容器（第五轮 N-7）', () => {
    expect(render('<badges type="accent"></badges>')).toBe('')
    expect(render('<badges>|  </badges>')).toBe('')
  })

  it(':::timeline 缺列行被忽略时通过 onWarning 上报（G6）', () => {
    const warnings: string[] = []
    const md = `:::timeline
- 2026年01月 | 项目启动 | 完成团队组建
- 缺列的行只有两列
:::`
    const html = parseMarkdown(md, COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(html).toContain('项目启动')
    expect(warnings.some((w) => w.includes('timeline') && w.includes('1 行'))).toBe(true)

    // 列数合法时无警告
    const okWarnings: string[] = []
    parseMarkdown(':::timeline\n- 2026年01月 | 启动 | 说明\n:::', COLORS, undefined, undefined, (w) => okWarnings.push(w))
    expect(okWarnings).toHaveLength(0)
  })

  it(':::table 后紧邻非表格行被吞为表注脚（G5 引擎行为固化，guide 已要求空行）', () => {
    const md = ':::table\n| 列A | 列B |\n| --- | --- |\n| 甲 | 乙 |\n:::\n紧随其后的正文行\n\n空行后的正常段落'
    const html = render(md)
    // 表注脚特征：右对齐 11px 灰色
    expect(html).toMatch(/text-align:right;font-size:11px;color:#94a3b8[^>]*>紧随其后的正文行/)
    expect(html).toContain('空行后的正常段落')
  })

  it('普通 GFM 表格后紧邻非管道行被吞为表注（同上，验证 guide 规则的引擎行为）', () => {
    const md = '| 列A | 列B |\n| --- | --- |\n| 甲 | 乙 |\n紧接的正文被当作注释'
    const html = render(md)
    // GFM 表注特征：tfoot 中 11px 灰色小字
    expect(html).toMatch(/<tfoot>.*font-size:11px;color:#94a3b8/)
    expect(html).toContain('紧接的正文被当作注释')
  })

  it(':::code-block 官方示例：protectCode 占位符还原后单框渲染、行标注生效（C-4 疑云排除）', () => {
    // 疑云验证：markdownParser 的 protectCode 先于容器解析把 body 内 ``` 围栏换成占位符，
    // 此前 CodeBlock_DA01.render 的 codeMatch 永失配，出口 restoreCode 又把占位符还原成
    // 完整 code section 嵌进外层 <pre>（双框），行内 // [!code focus] 标注全部失效。
    const example = CodeBlock_DA01.spec.example
    const html = render(example)
    // 1. 单框：整个产物只允许一个 data-block="code" section（容器外套 + 出口还原 = 双框即 >1）
    expect((html.match(/data-block="code"/g) || []).length).toBe(1)
    // 2. 无占位符残渣：私有区字符 \uE002/\uE003 不得出现在产物（此前 B0 字面残留）
    expect(html).not.toContain('\uE002')
    expect(html).not.toContain('\uE003')
    expect(html).not.toMatch(/<span[^>]*>B0<\/span>/)
    // 3. 代码内容真实进入高亮区（而非被剥成空 <pre>）
    expect(html).toContain('function')
    expect(html).toContain('console')
    // 4. 行内注释行标注生效（[!code focus] 特征样式：rgba(56,139,253) 背景）
    expect(html).toContain('rgba(56,139,253')
    expect(html).toContain('rgba(255,235,59')  // [!code highlight]
    // 5. 容器头部 title 与语言徽标保留
    expect(html).toContain('示例')
  })

  it('裸围栏 ```js{2,4} 与 :::code-block 的 {行号} 范围高亮生效（C-4 附带能力）', () => {
    // 围栏 info 中的 {2,4} 行号标注：无行内注释的行按 highlight 样式高亮
    const html = render('```js{2,4}\nconst a = 1\nconst b = 2\nconst c = 3\nconst d = 4\n```')
    // highlight 特征样式计数：行 2 与行 4 各一次
    expect((html.match(/rgba\(255,235,59,0\.14\)/g) || []).length).toBe(2)
    // 行内容仍在（注意 hljs 会把 const 拆成独立 span，探针取「 b = 」避免误判）
    expect(html).toContain(' b = ')
    expect(html).toContain(' d = ')
  })

  it(':::code-block attrs.lang 与围栏 {行号} 并写时区间标注不丢（第八轮 MINOR-5）', () => {
    // attrs.lang="js" 存在时，围栏 info "js{2}" 的行号区间若被静默丢弃，第 2 行不会高亮
    const md = ':::code-block lang="js"\n```js{2}\nconst a = 1\nconst b = 2\nconst c = 3\n```\n:::'
    const html = render(md)
    // 行 2（无行内注释）经 rangeLines 命中 → highlight 浅色出现一次
    expect((html.match(/rgba\(255,235,59,0\.14\)/g) || []).length).toBe(1)
    expect(html).toContain(' b = ')
    expect(html).not.toContain('\uE002')
  })

  it('parseLangLineRanges 解析围栏行号标注（单元测试）', () => {
    expect([...parseLangLineRanges('js{2,4-5}')]).toEqual([1, 3, 4])
    expect(parseLangLineRanges('js').size).toBe(0)
    expect([...parseLangLineRanges('python{10-11}')]).toEqual([9, 10])
    // 颠倒区间 / 超界防御
    expect(parseLangLineRanges('js{5-2}').size).toBe(0)
    expect(parseLangLineRanges('js{99999}').size).toBe(0)
    // 重复/重叠区间去重（Set 语义）
    expect([...parseLangLineRanges('js{2,2-3,3}')].sort((a, b) => a - b)).toEqual([1, 2])
  })
})

// ── E. 未闭合标签 / 容器降级（C-1 / C-2 回归契约） ─────────────

describe('未闭合标签与容器降级（C-1/C-2）', () => {
  it('未闭合 <title>：定界符行转义（防 RCDATA 吞文）、正文逐行存活、onWarning 上报', () => {
    const warnings: string[] = []
    const html = parseMarkdown('<title>未闭合\n正文第一行内容\n正文第二行内容', COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(html).toContain('&lt;title')
    expect(html).not.toContain('<title>未闭合')
    expect(html).toContain('正文第一行内容')
    expect(html).toContain('正文第二行内容')
    expect(warnings.some((w) => w.includes('未闭合'))).toBe(true)
  })

  it('未闭合 <p-title>：定界符行转义、正文逐行存活、onWarning 上报', () => {
    const warnings: string[] = []
    const html = parseMarkdown('<p-title>未闭合\n正文第一行内容\n正文第二行内容', COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(html).toContain('&lt;p-title')
    expect(html).not.toContain('<p-title>未闭合')
    expect(html).toContain('正文第一行内容')
    expect(html).toContain('正文第二行内容')
    expect(warnings.some((w) => w.includes('未闭合'))).toBe(true)
  })

  it('未闭合 :::tip：onWarning 上报「未闭合」且容器体按普通文本逐行解析', () => {
    const warnings: string[] = []
    const html = parseMarkdown(':::tip\n容器内正文第一行\n容器内正文第二行', COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(html).toContain('容器内正文第一行')
    expect(html).toContain('容器内正文第二行')
    expect(warnings.some((w) => w.includes(':::tip') && w.includes('未闭合'))).toBe(true)
  })

  it('未闭合 :::table：onWarning 上报「未闭合」且表体行仍存活', () => {
    const warnings: string[] = []
    parseMarkdown(':::table\n| 列A | 列B |\n| --- | --- |\n| 甲 | 乙 |', COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(warnings.some((w) => w.includes(':::table') && w.includes('未闭合'))).toBe(true)
  })

  it('未闭合 $$：onWarning 上报「未闭合」且后续正文存活', () => {
    const warnings: string[] = []
    const html = parseMarkdown('$$\n\\int_0^1 x^2 \\,dx\n后续正文行内容', COLORS, undefined, undefined, (w) => warnings.push(w))
    expect(html).toContain('后续正文行内容')
    expect(warnings.some((w) => w.includes('未闭合'))).toBe(true)
  })
})

