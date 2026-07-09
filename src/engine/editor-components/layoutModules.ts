/**
 * layoutModules.ts — 高级排版模块（Layout Catalog）
 *
 * 共 38 个高级排版组件，覆盖公众号长文的核心排版场景：
 *   开篇引导 / 章节分隔 / 数据展示 / 对比分析 / 时间轴 / 引用金句
 *   图片标注 / 常见问题 / 清单 / 案例 / 作者卡 / 提示框 / 术语定义 等
 *
 * 每个组件的 render 直接委托给 parseMarkdown，
 * 由 ExtensionPage 通过 parseExampleTag 解析 example 后传入 body。
 *
 * 编号规则：Layout_DA01 ~ Layout_DA38
 *   Layout = 布局模块，D = Default，A = A 型，01-38 = 序号
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import type { ComponentDef } from './index'
import { parseMarkdown } from '../utils/markdownParser'
import { useAppStore } from '@/lib/appStore'

// ── 工厂函数 ──
function layoutDef(
  id: string,
  name: string,
  tag: string,
  example: string,
  attrs?: ComponentDef['attrs'],
): ComponentDef {
  return {
    id,
    name,
    tag,
    attrs,
    example,
    render(_attrs: Record<string, string>, body: string, t: ThemeColors): string {
      // 每次渲染都从 store 读取最新主题令牌，保证预览跟随主题变化
      const tokens = useAppStore.getState().themeTokens
      try {
        return parseMarkdown(body, t, undefined, undefined, undefined, tokens)
      } catch {
        return ''
      }
    },
  }
}

// ════════════════════════════════════════════════════════════
// 1. 开篇主视觉
// ════════════════════════════════════════════════════════════
const Layout_DA01 = layoutDef(
  'Layout_DA01',
  '开篇主视觉',
  'hero',
  `:::hero
eyebrow: 深度观察
title: 公众号排版的真问题
subtitle: 不是好不好看，是读者读不读得完
cta_text: ↓ 3 分钟，给你一个判断
:::`,
  [
    { key: 'eyebrow', label: '标签', required: true },
    { key: 'title', label: '主标题', required: true },
    { key: 'subtitle', label: '副标题' },
    { key: 'cta_text', label: '引导文案' },
  ],
)

// ════════════════════════════════════════════════════════════
// 2. 阅读导航
// ════════════════════════════════════════════════════════════
const Layout_DA02 = layoutDef(
  'Layout_DA02',
  '阅读导航',
  'toc',
  `:::toc
01 | 问题定义 | 为什么现有排版让读者离开
02 | 模块原理 | 43 个模块各自解决什么
03 | 实战示例 | 一篇观点文的完整排版过程
:::`,
  [
    { key: 'rows', label: '每行格式：序号 | 章节名 | 说明' },
  ],
)

// ════════════════════════════════════════════════════════════
// 3. 开篇卡片矩阵
// ════════════════════════════════════════════════════════════
const Layout_DA03 = layoutDef(
  'Layout_DA03',
  '开篇卡片矩阵',
  'cards',
  `:::cards
PART 01 | 问题 | 读者为什么不读你的文章 | accent
PART 02 | 原理 | 排版如何降低阅读决策成本 | default
PART 03 | 实战 | 43 个模块的选择逻辑 | default
:::`,
  [
    { key: 'rows', label: '每行格式：标题 | 副标题 | 说明 | 颜色', options: ['accent', 'default'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 4. 章节分隔
// ════════════════════════════════════════════════════════════
const Layout_DA04 = layoutDef(
  'Layout_DA04',
  '章节分隔',
  'part',
  `:::part
eyebrow: PART 02
title: 模块选择逻辑
body: 不是每篇文章都需要 43 个模块。核心是：每件事做一个，做好一个。
:::`,
  [
    { key: 'eyebrow', label: '章节标', required: true },
    { key: 'title', label: '标题', required: true },
    { key: 'body', label: '说明' },
  ],
)

// ════════════════════════════════════════════════════════════
// 5. 标签标题
// ════════════════════════════════════════════════════════════
const Layout_DA05 = layoutDef(
  'Layout_DA05',
  '标签标题',
  'label-title',
  `:::label-title
label: 行业洞察
title: 公众号创作者正在经历什么
:::`,
  [
    { key: 'label', label: '标签', required: true },
    { key: 'title', label: '标题', required: true },
  ],
)

// ════════════════════════════════════════════════════════════
// 6. 核心数据行
// ════════════════════════════════════════════════════════════
const Layout_DA06 = layoutDef(
  'Layout_DA06',
  '核心数据行',
  'metrics',
  `:::metrics
付费转化率 | 23% | 比上月提升 8 个百分点 | accent
平均阅读时长 | 4.2分钟 | 高于行业均值 1.8x | default
:::`,
  [
    { key: 'rows', label: '每行格式：指标名 | 数值 | 说明 | 颜色', options: ['accent', 'default'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 7. 单条信息图
// ════════════════════════════════════════════════════════════
const Layout_DA07 = layoutDef(
  'Layout_DA07',
  '单条信息图',
  'infographic',
  `:::infographic
type: data
value: 79%
label: 完读率
note: 使用高级排版模块后的平均表现
:::`,
  [
    { key: 'type', label: '类型', required: true, options: ['data', 'quote', 'fact'] },
    { key: 'value', label: '数值' },
    { key: 'label', label: '标签' },
    { key: 'note', label: '备注' },
  ],
)

// ════════════════════════════════════════════════════════════
// 8. 对比行
// ════════════════════════════════════════════════════════════
const Layout_DA08 = layoutDef(
  'Layout_DA08',
  '对比行',
  'compare',
  `:::compare
文章打开率 | 旧版排版 3.2% | 新版模块化排版 8.7% | accent
读者完读率 | 41% | 79% | default
:::`,
  [
    { key: 'rows', label: '每行格式：维度 | A方描述 | B方描述 | 颜色', options: ['accent', 'default'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 9. 步骤卡
// ════════════════════════════════════════════════════════════
const Layout_DA09 = layoutDef(
  'Layout_DA09',
  '步骤卡',
  'steps',
  `:::steps
01 | 发现模块 | layout list 列出所有可用模块
02 | 查看规格 | layout show 确认字段和示例
03 | 写进文章 | 直接粘贴 :::module 语法
:::`,
  [
    { key: 'rows', label: '每行格式：序号 | 步骤名 | 步骤说明' },
  ],
)

// ════════════════════════════════════════════════════════════
// 10. 时间轴
// ════════════════════════════════════════════════════════════
const Layout_DA10 = layoutDef(
  'Layout_DA10',
  '时间轴',
  'timeline',
  `:::timeline
2023.01 | 初版上线 | 支持基础 Markdown 转换
2023.09 | 主题系统 | 推出 48 个专业主题
2025.01 | Layout Catalog | 43 个高级排版模块发布
:::`,
  [
    { key: 'rows', label: '每行格式：时间点 | 事件标题 | 事件说明' },
  ],
)

// ════════════════════════════════════════════════════════════
// 11. 最终判断卡
// ════════════════════════════════════════════════════════════
const Layout_DA11 = layoutDef(
  'Layout_DA11',
  '最终判断卡',
  'verdict',
  `:::verdict
eyebrow: 最终判断
title: 真正的护城河不是模块数量，而是品牌表达系统
body: 每个模块必须服务一个真实的阅读任务，否则只是换皮。
:::`,
  [
    { key: 'eyebrow', label: '标签', required: true },
    { key: 'title', label: '判断', required: true },
    { key: 'body', label: '说明' },
    { key: 'note', label: '备注' },
  ],
)

// ════════════════════════════════════════════════════════════
// 12. 读者匹配卡
// ════════════════════════════════════════════════════════════
const Layout_DA12 = layoutDef(
  'Layout_DA12',
  '读者匹配卡',
  'audience-fit',
  `:::audience-fit
fit | 想用 AI 工具提升公众号制作效率的创作者
fit | 有固定更新节奏、需要稳定输出的自媒体人
not-fit | 刚开始写公众号的新手
:::`,
  [
    { key: 'rows', label: '每行格式：fit/not-fit | 描述', options: ['fit', 'not-fit'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 13. 认知纠偏
// ════════════════════════════════════════════════════════════
const Layout_DA13 = layoutDef(
  'Layout_DA13',
  '认知纠偏',
  'myth-fact',
  `:::myth-fact
myth | 排版好看就是配色丰富
fact | 排版的本质是让读者更快做出阅读决策
:::`,
  [
    { key: 'rows', label: '每行格式：myth/fact | 内容', options: ['myth', 'fact'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 14. 宣言卡
// ════════════════════════════════════════════════════════════
const Layout_DA14 = layoutDef(
  'Layout_DA14',
  '宣言卡',
  'manifesto',
  `:::manifesto
eyebrow: 我们相信
title: 内容的价值不在于看起来多专业，而在于读者读完后想做点什么
:::`,
  [
    { key: 'eyebrow', label: '标签', required: true },
    { key: 'title', label: '宣言', required: true },
  ],
)

// ════════════════════════════════════════════════════════════
// 15. 转场
// ════════════════════════════════════════════════════════════
const Layout_DA15 = layoutDef(
  'Layout_DA15',
  '转场',
  'bridge',
  `:::bridge
from: 我们看完了问题是什么
to: 现在来看怎么解决
:::`,
  [
    { key: 'from', label: '承上', required: true },
    { key: 'to', label: '启下', required: true },
  ],
)

// ════════════════════════════════════════════════════════════
// 16. 引用强调
// ════════════════════════════════════════════════════════════
const Layout_DA16 = layoutDef(
  'Layout_DA16',
  '引用强调',
  'quote',
  `:::quote
一句话能让读者决定读不读，一段话能让读者决定收不收藏。 | 极客旅程 | 内容设计原则
:::`,
  [
    { key: 'rows', label: '每行格式：引用内容 | 来源 | 作者' },
  ],
)

// ════════════════════════════════════════════════════════════
// 17. 图片标注
// ════════════════════════════════════════════════════════════
const Layout_DA17 = layoutDef(
  'Layout_DA17',
  '图片标注',
  'image-annotate',
  `:::image-annotate
src: https://robocopmao.github.io/r-markdown/banner4.webp
title: 公众号后台截图解读
point: 01 | 12 | 15 | 标题区域 | 读者扫到的第一眼
:::`,
  [
    { key: 'src', label: '图片URL' },
    { key: 'title', label: '标题' },
    { key: 'point', label: '标注点：序号|x|y|标签|说明' },
  ],
)

// ════════════════════════════════════════════════════════════
// 18. 图片对比
// ════════════════════════════════════════════════════════════
const Layout_DA18 = layoutDef(
  'Layout_DA18',
  '图片对比',
  'image-compare',
  `:::image-compare
before: https://robocopmao.github.io/r-markdown/banner4.webp
after: https://robocopmao.github.io/r-markdown/banner4.webp
label_before: 旧版排版
label_after: 新版模块化排版
:::`,
  [
    { key: 'before', label: '原图' },
    { key: 'after', label: '对比图' },
    { key: 'label_before', label: '原图标签' },
    { key: 'label_after', label: '对比图标签' },
  ],
)

// ════════════════════════════════════════════════════════════
// 19. 图片步骤
// ════════════════════════════════════════════════════════════
const Layout_DA19 = layoutDef(
  'Layout_DA19',
  '图片步骤',
  'image-steps',
  `:::image-steps
01 | 打开配置文件 | https://robocopmao.github.io/r-markdown/banner4.webp
02 | 填入 API Key | https://robocopmao.github.io/r-markdown/banner4.webp
:::`,
  [
    { key: 'rows', label: '每行格式：序号 | 说明 | 图片URL' },
  ],
)

// ════════════════════════════════════════════════════════════
// 20. 图文并排
// ════════════════════════════════════════════════════════════
const Layout_DA20 = layoutDef(
  'Layout_DA20',
  '图文并排',
  'image-text',
  `:::image-text
src: https://robocopmao.github.io/r-markdown/banner4.webp
title: 模块化排版的效果
body: 用固定结构替代手工堆砌，每篇文章都有一致的品牌气质。
:::`,
  [
    { key: 'src', label: '图片URL', required: true },
    { key: 'title', label: '标题', required: true },
    { key: 'body', label: '正文' },
  ],
)

// ════════════════════════════════════════════════════════════
// 21. 常见问题
// ════════════════════════════════════════════════════════════
const Layout_DA21 = layoutDef(
  'Layout_DA21',
  '常见问题',
  'faq',
  `:::faq
这些模块只能在某个主题里用吗？ | 不是，48 个专业主题都支持高级排版模块。
API 模式和 AI 模式有什么区别？ | API 模式直接转换输出 HTML，AI 模式生成提示词给外部 AI。
:::`,
  [
    { key: 'rows', label: '每行格式：问题 | 回答' },
  ],
)

// ════════════════════════════════════════════════════════════
// 22. 清单
// ════════════════════════════════════════════════════════════
const Layout_DA22 = layoutDef(
  'Layout_DA22',
  '清单',
  'checklist',
  `:::checklist
md2wechat layout validate 通过 | done
封面图已准备好 | todo
摘要已填写 | todo
:::`,
  [
    { key: 'rows', label: '每行格式：描述 | 状态', options: ['done', 'todo', 'na'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 23. 案例卡
// ════════════════════════════════════════════════════════════
const Layout_DA23 = layoutDef(
  'Layout_DA23',
  '案例卡',
  'cases',
  `:::cases
某科技公众号 | 科技媒体 | 使用模块化排版后，平均完读率从 41% 提升到 79%
某企业内刊 | 金融行业 | 标准化模板让制作时间从 2小时降至 35分钟
:::`,
  [
    { key: 'rows', label: '每行格式：案例名 | 行业 | 结果描述' },
  ],
)

// ════════════════════════════════════════════════════════════
// 24. 文章总结
// ════════════════════════════════════════════════════════════
const Layout_DA24 = layoutDef(
  'Layout_DA24',
  '文章总结',
  'summary',
  `:::summary
高级排版模块只在 API 模式下工作
每个模块只服务 4 件事之一：attention / readability / memorability / conversion
一篇文章 hero 1 个、verdict 1 个、cta 1 个，不要堆模块
:::`,
  [
    { key: 'items', label: '每行一个要点' },
  ],
)

// ════════════════════════════════════════════════════════════
// 25. 重要通知
// ════════════════════════════════════════════════════════════
const Layout_DA25 = layoutDef(
  'Layout_DA25',
  '重要通知',
  'notice',
  `:::notice
title: 重要提醒
body: 高级排版模块需要 API Key 才能使用。如需开通，请联系作者。
:::`,
  [
    { key: 'title', label: '标题', required: true },
    { key: 'body', label: '正文', required: true },
  ],
)

// ════════════════════════════════════════════════════════════
// 26. 作者卡片
// ════════════════════════════════════════════════════════════
const Layout_DA26 = layoutDef(
  'Layout_DA26',
  '作者卡片',
  'author-card',
  `:::author-card
name: 极客旅程
bio: 研究内容创作工具和 AI 工作流，专注公众号效率提升。
:::`,
  [
    { key: 'name', label: '姓名', required: true },
    { key: 'bio', label: '简介', required: true },
    { key: 'avatar', label: '头像URL' },
    { key: 'role', label: '职位' },
    { key: 'tags', label: '标签' },
    { key: 'link', label: '链接' },
  ],
)

// ════════════════════════════════════════════════════════════
// 27. 关注引导
// ════════════════════════════════════════════════════════════
const Layout_DA27 = layoutDef(
  'Layout_DA27',
  '关注引导',
  'subscribe',
  `:::subscribe
title: 关注极客旅程
body: 每周一篇，分享 AI 工具和内容创作方法论。
:::`,
  [
    { key: 'title', label: '标题', required: true },
    { key: 'body', label: '说明', required: true },
  ],
)

// ════════════════════════════════════════════════════════════
// 28. 人物卡
// ════════════════════════════════════════════════════════════
const Layout_DA28 = layoutDef(
  'Layout_DA28',
  '人物卡',
  'people',
  `:::people
张明 | 内容策略总监 | 10年媒体经验，主导过多个千万级公众号的内容体系建设
李华 | AI产品经理 | 专注 AI 写作工具研发，服务超过 500 个创作团队
:::`,
  [
    { key: 'rows', label: '每行格式：姓名 | 职位 | 简介' },
  ],
)

// ════════════════════════════════════════════════════════════
// 29. 系列说明
// ════════════════════════════════════════════════════════════
const Layout_DA29 = layoutDef(
  'Layout_DA29',
  '系列说明',
  'series',
  `:::series
name: 公众号排版进阶系列
episode: 第 3 篇，共 5 篇
topic: 高级排版模块实战指南
:::`,
  [
    { key: 'name', label: '系列名', required: true },
    { key: 'episode', label: '篇序' },
    { key: 'topic', label: '本篇主题' },
  ],
)

// ════════════════════════════════════════════════════════════
// 30. 提示框
// ════════════════════════════════════════════════════════════
const Layout_DA30 = layoutDef(
  'Layout_DA30',
  '提示框',
  'callout',
  `:::callout warning
⚠️ 注意：高级排版模块仅在 API 模式下渲染，AI 模式不支持。
:::`,
  [
    { key: 'type', label: '类型', options: ['info', 'tip', 'warning', 'success', 'danger'] },
  ],
)

// ════════════════════════════════════════════════════════════
// 31. 术语定义
// ════════════════════════════════════════════════════════════
const Layout_DA31 = layoutDef(
  'Layout_DA31',
  '术语定义',
  'definition',
  `:::definition
{"term":"OKR","def":"目标与关键结果","termLabel":"术语"}
:::`,
  [
    { key: 'term', label: '术语', required: true },
    { key: 'def', label: '定义', required: true },
    { key: 'termLabel', label: '类型' },
  ],
)

// ════════════════════════════════════════════════════════════
// 32. 金句卡
// ════════════════════════════════════════════════════════════
const Layout_DA32 = layoutDef(
  'Layout_DA32',
  '金句卡',
  'quote-card',
  `:::quote-card
{"text":"结构先于风格，骨架决定气质","source":"内容设计原则"}
:::`,
  [
    { key: 'text', label: '金句', required: true },
    { key: 'source', label: '来源' },
  ],
)

// ════════════════════════════════════════════════════════════
// 33. 推文引用
// ════════════════════════════════════════════════════════════
const Layout_DA33 = layoutDef(
  'Layout_DA33',
  '推文引用',
  'tweet',
  `:::tweet
{"name":"内容创作者","handle":"@creator","text":"这套排版模块真的让我的制作效率提升了不止一倍。","timestamp":"2026-01-01","likes":"1.2K"}
:::`,
  [
    { key: 'name', label: '用户名', required: true },
    { key: 'handle', label: '账号' },
    { key: 'text', label: '内容', required: true },
    { key: 'timestamp', label: '时间' },
    { key: 'likes', label: '点赞' },
  ],
)

// ════════════════════════════════════════════════════════════
// 34. 内联数据行
// ════════════════════════════════════════════════════════════
const Layout_DA34 = layoutDef(
  'Layout_DA34',
  '内联数据行',
  'stat-row',
  `:::stat-row
[{"label":"完读率","value":"79%"},{"label":"制作时间","value":"35","unit":"分钟"},{"label":"主题可选","value":"40","unit":"个"}]
:::`,
  [
    { key: 'items', label: '每项结构：{label, value, unit?, note?}' },
  ],
)

// ════════════════════════════════════════════════════════════
// 35. 问答
// ════════════════════════════════════════════════════════════
const Layout_DA35 = layoutDef(
  'Layout_DA35',
  '问答',
  'question',
  `:::question
[{"q":"为什么要用高级排版模块？","a":"因为普通 Markdown 在微信里没有视觉层级。"},{"q":"需要懂设计吗？","a":"不需要，照着字段填写就行。"}]
:::`,
  [
    { key: 'items', label: '每项结构：{q(问题), a(回答)}' },
  ],
)

// ════════════════════════════════════════════════════════════
// 36. 对比表格
// ════════════════════════════════════════════════════════════
const Layout_DA36 = layoutDef(
  'Layout_DA36',
  '对比表格',
  'comparison-table',
  `:::comparison-table
{"left":{"title":"AI 模式","items":["灵活度高","支持多种风格","不需要 API Key"]},"right":{"title":"API 模式","items":["稳定一致","支持 43 个排版模块","支持 48 个专业主题"]}}
:::`,
  [
    { key: 'left', label: '左侧：{title, items[]}' },
    { key: 'right', label: '右侧：{title, items[]}' },
  ],
)

// ════════════════════════════════════════════════════════════
// 37. 版本日志
// ════════════════════════════════════════════════════════════
const Layout_DA37 = layoutDef(
  'Layout_DA37',
  '版本日志',
  'changelog',
  `:::changelog
{"version":"v2.3.1","date":"2026-05-28","added":["精选主题 wechat-native"],"changed":["主题发现与文档口径校准"],"fixed":["api.yaml 中的主题无法被 CLI 发现"]}
:::`,
  [
    { key: 'version', label: '版本', required: true },
    { key: 'date', label: '日期' },
    { key: 'added', label: '新增' },
    { key: 'changed', label: '变更' },
    { key: 'fixed', label: '修复' },
  ],
)

// ════════════════════════════════════════════════════════════
// 38. 资源列表
// ════════════════════════════════════════════════════════════
const Layout_DA38 = layoutDef(
  'Layout_DA38',
  '资源列表',
  'resource-list',
  `:::resource-list
[{"icon":"🛠","name":"md2wechat CLI","url":"https://github.com/geekjourneyx/md2wechat-skill","desc":"Markdown 转微信的命令行工具"},{"icon":"📖","name":"Layout 教程","url":"https://github.com/geekjourneyx/md2wechat-skill/blob/main/docs/LAYOUT.md","desc":"43 个模块详解"}]
:::`,
  [
    { key: 'items', label: '每项结构：{icon?, name(必填), url(链接), desc(说明)}' },
  ],
)

// ════════════════════════════════════════════════════════════
// 导出数组
// ════════════════════════════════════════════════════════════
export const layoutModuleComponents: ComponentDef[] = [
  Layout_DA01,
  Layout_DA02,
  Layout_DA03,
  Layout_DA04,
  Layout_DA05,
  Layout_DA06,
  Layout_DA07,
  Layout_DA08,
  Layout_DA09,
  Layout_DA10,
  Layout_DA11,
  Layout_DA12,
  Layout_DA13,
  Layout_DA14,
  Layout_DA15,
  Layout_DA16,
  Layout_DA17,
  Layout_DA18,
  Layout_DA19,
  Layout_DA20,
  Layout_DA21,
  Layout_DA22,
  Layout_DA23,
  Layout_DA24,
  Layout_DA25,
  Layout_DA26,
  Layout_DA27,
  Layout_DA28,
  Layout_DA29,
  Layout_DA30,
  Layout_DA31,
  Layout_DA32,
  Layout_DA33,
  Layout_DA34,
  Layout_DA35,
  Layout_DA36,
  Layout_DA37,
  Layout_DA38,
]