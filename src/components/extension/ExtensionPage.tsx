import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { components, unifiedComponents, type ComponentDef } from '@engine';
import type { UnifiedComponentDef } from '@engine/editor-components/unifiedRender';
import { renderPreview } from '@engine/editor-components/unifiedRender';
import { layoutModuleSpecs, layoutRendererByName } from '@engine/layout-modules';
import type { LayoutModuleSpec } from '@engine/layout-modules/types';
import { useAppStore } from '@/lib/appStore';
import { resolveTokens } from '@engine/tokens';
import type { BlockRenderContext } from '@engine/utils/blockRenderRegistry';
import { useStore } from '@/lib/store';
import { copyText } from '@/lib/clipboard';
import { sanitizeHtml } from '@/lib/htmlSanitizer';
import { Toast } from '@/components/ui/Toast';
import { X } from '@/components/ui/Icon';

function fallbackExample(bodyFormat: string): string {
  switch (bodyFormat) {
    case 'fields': return 'label: 示例标签\ntitle: 示例标题\nsubtitle: 示例副标题';
    case 'rows': return '项目一 | 描述一\n项目二 | 描述二\n项目三 | 描述三';
    case 'markdown': return '示例正文内容，支持 **粗体** 和 *斜体*。\n- 列表项一\n- 列表项二';
    case 'json_object': return '{"term":"示例术语","def":"示例定义","termLabel":"术语"}';
    case 'json_array': return '[{"label":"示例指标","value":"100%"}]';
    default: return '';
  }
}

const LAYOUT_EXAMPLES: Record<string, string> = {
  // ── opening ──
  hero: 'label: 深度观察\ntitle: 为什么读者不愿意读下去\nsubtitle: 不是你的内容不够好，是结构没有替读者省力气。模块化排版让每篇文章都像专业编辑操刀。\ncta_text: 查看完整方法论 →',
  toc: '01 | 问题定义 | 为什么现有排版让读者在 3 秒内离开\n02 | 模块原理 | 61 个排版组件各自解决什么场景问题\n03 | 实战示例 | 一篇观点文的完整排版过程拆解\n04 | 数据验证 | 模块化 vs 手工排版的阅读数据对比\n05 | 上手路径 | 从第一个模块到完整工作流的 10 分钟指南',
  cards: '⚡ 极简上手 | 3 步写完第一篇排版 | 从空白草稿到可发布成品，只需填写字段 + 预览 + 复制\n🎨 52 套主题 | 一键切换品牌气质 | 从学术严谨到新锐科技，选中即用无需调色\n📊 数据驱动 | 完读率提升 1.8x | 真实用户测试验证的排版模式，不是拍脑袋设计',
  part: 'label: CHAPTER 02\ntitle: 模块化排版的四个核心原则\nbody: 在深入具体模块之前，我们先建立一套评估框架——什么样的排版才算「好排版」？本章从认知负荷、视觉节奏、信息密度和品牌一致性四个维度展开。',

  // ── infographic ──
  metrics: '完读率 | 79% | 高于行业均值 1.8 倍 | accent\n制作时间 | 35 分钟 | 较旧版手工排版节省 60% | default\n读者收藏率 | 23.6% | 同比增长 4.2 个百分点 | default\n分享转发率 | 8.1% | 干货类推文排名前 5% | accent',
  infographic: 'label: 读者画像\ntitle: 谁在看你的文章\nsubtitle: 基于 12,000 份问卷的核心发现\nbody: |\n  78% 的读者会在 5 秒内判断是否继续阅读\n  排版质量直接影响信任度评分（r=0.71）\n  手机端阅读占比 83%，但大多数文章按桌面端设计',
  compare: '模块化排版 | 上手 10 分钟 | 品牌一致性 95% | 读者完读率 79% | accent\n手工排版 | 熟练需 3 个月 | 品牌一致性 60% | 读者完读率 41% | default',
  steps: '01 | 发现模块 | 浏览组件库，找到适合当前场景的排版模块\n02 | 查看规格 | 展开模块详情，确认必填字段和示例格式\n03 | 复制语法 | 复制 ::: 容器代码到编辑器中对应位置\n04 | 编辑内容 | 替换字段值为实际内容，保存后实时预览\n05 | 导出发布 | 导出公众号 HTML，或复制富文本到公众号后台',
  timeline: '2024 Q1 | 项目启动 | 完成团队组建与需求调研，确定技术选型\n2024 Q2 | MVP 上线 | 核心渲染引擎完成，支持 12 个基础模块\n2024 Q3 | 主题系统 | 52 套专业主题上线，支持一键切换品牌风格\n2024 Q4 | 模块扩展 | 排版组件增至 61 个，覆盖全内容场景\n2025 Q1 | 生态建设 | 开放 AI 排版指令库，社区贡献 200+ 风格模板',

  // ── judgment ──
  verdict: 'label: 最终判断\ntitle: 排版的本质不是「好看」，是「降低认知成本」\nbody: 每一篇文章都是一次决策——读者在 3 秒内决定留下还是划走。排版的价值不在于装饰，而在于用结构告诉读者：这里有你要的答案，而且不难读。',
  'audience-fit': '技术团队 | 结构严谨、代码块清晰、API 文档可直接复制 | 高\n运营人员 | 步骤卡片 + 指标看板，一眼看到关键数据和行动项 | 高\nC 端读者 | 标题吸睛、金句醒目、图文混排降低阅读疲劳 | 中',
  'myth-fact': '排版就是加粗变色 | 排版是信息架构的可视化，核心是降低读者的认知负荷\n好看的文章一定好读 | 视觉吸引力只是入口，阅读完成率取决于结构是否匹配阅读习惯\n模块化排版让文章千篇一律 | 52 套主题 + 灵活字段组合，每篇都可以有独特气质',
  manifesto: 'label: 设计原则\ntitle: 好排版让信息自己会说话\nsubtitle: 六个字概括：少即是多，结构优先',
  bridge: 'label: 接下来\ntitle: 从「知道」到「做到」只差一个模块\nbody: 我们已经讲完了为什么模块化排版有效、每个模块解决什么问题、以及如何组合使用。下面进入实战——用五个模块完成一篇完整观点文。',

  // ── evidence ──
  quote: '最好的排版是让读者感觉不到排版的存在——他们的注意力完全被内容吸引，而不是被装饰分散。 | 唐·诺曼 | 《设计心理学》作者',
  'image-annotate': 'src: https://robocopmao.github.io/r-markdown/banner4.webp\ntitle: 模块化排版引擎架构\nbody: 从上到下依次为：Markdown 解析层 → 模块匹配层 → 主题令牌注入 → 内联样式 HTML 输出',
  'image-compare': 'left-src: https://robocopmao.github.io/r-markdown/banner4.webp\nright-src: https://robocopmao.github.io/r-markdown/banner4.webp\nleft-label: 传统手工排版\nright-label: MarkFlow 模块化\ncaption: 同一篇文章的两种排版方式对比：左侧为设计师手工调整（耗时 2h），右侧为 MarkFlow 一键生成（耗时 3min）',
  'image-steps': '01 | 选择模块 | https://robocopmao.github.io/r-markdown/banner4.webp | 在组件库中找到合适的排版模块\n02 | 填入内容 | https://robocopmao.github.io/r-markdown/banner4.webp | 按字段格式替换为实际文案\n03 | 实时预览 | https://robocopmao.github.io/r-markdown/banner4.webp | 右侧即时查看渲染效果',
  'image-text': 'src: https://robocopmao.github.io/r-markdown/banner4.webp\ntitle: 移动端阅读体验优化\nbody: 所有模块均针对手机竖屏（375-414px 视口）做了适配。图片自动缩放、表格横向滚动、卡片单列堆叠。无需额外调整即可同时适配桌面端与移动端。\nlayout: right',

  // ── conversion ──
  faq: '这些排版模块能在公众号后台直接使用吗？ | 可以。MarkFlow 输出的内联样式 HTML 可直接粘贴到公众号编辑器，样式不会丢失。\n需要付费吗？ | 全部 61 个排版组件 + 52 套主题免费使用，无任何功能限制。\n支持导出为图片吗？ | 支持一键导出完整长图 PNG，适合在知识星球、社群等平台分发。',
  checklist: '☐ 确定文章核心观点（一句话能说清） | true\n☐ 搭建大纲框架（3-5 个主段落） | true\n☐ 为每个段落选择合适的排版模块 | false\n☐ 填充正文内容并调整字段 | false\n☐ 预览移动端显示效果 | false\n☐ 复制富文本到公众号后台 | false',
  cases: '01 | 自媒体主创小李 | 从 2 小时到 10 分钟，排版效率提升 12 倍，月产出从 8 篇增至 20 篇\n02 | 技术博主老张 | 代码块 + 术语定义卡的组合让技术教程的收藏率翻倍\n03 | 企业培训师王姐 | A4 文档模式直接输出培训手册，省去排版外包费用',
  summary: '核心要点回顾：\n\n1. **模块化排版的本质**是降低读者的认知成本，而非堆砌装饰\n2. **61 个排版组件**覆盖从开篇吸引到结尾转化的完整阅读旅程\n3. **52 套主题**让你一键切换品牌气质，无需设计背景\n4. **导出链路**支持富文本、长图、A4 文档、卡片等多种成品形态\n\n下一步：打开组件库，挑一个模块试写你的第一段排版。',
  notice: 'label: 重要通知\ntitle: 主题系统 v2.0 已上线\ndetail: 新增 12 套专业主题配色，涵盖学术论文、科技周刊、品牌营销三大场景。旧版主题配置文件仍可使用，但建议迁移至新版以获得更好的色彩一致性。',

  // ── brand ──
  'author-card': 'name: 极客旅程\navatar: https://robocopmao.github.io/r-markdown/banner4.webp\nbio: 专注内容排版与知识管理工具链，帮助创作者用更少的时间做出更好的内容。\nrole: 主理人 · 全栈开发者',
  subscribe: 'title: 关注「极客旅程」\nsubtitle: 每周更新排版技巧与内容策略\nbody: 已有 12,000+ 创作者订阅。不打扰，只发干货。\nplaceholder: 输入邮箱地址\nbtn: 立即订阅',
  people: '张三 | 前端工程师 | 负责 Markdown 渲染引擎开发，热衷于探索 CSS 内联样式在富文本场景下的极限 | https://robocopmao.github.io/r-markdown/banner4.webp\n李四 | 产品设计师 | 52 套主题的主要设计者，坚持「好看的前提是好读」 | https://robocopmao.github.io/r-markdown/banner4.webp',
  series: 'series: MarkFlow 完全指南\nindex: 2\ntitle: 第二章：掌握 61 个排版组件\nsubtitle: 从开篇到结尾，构建完整阅读体验',

  // ── sprint4 ──
  callout: '> **💡 提示**\n> 如果你不确定应该用哪个模块，打开组件库的「结构导航」分类，那里的 **阅读路线**（reading-path）和 **章节分隔**（part）是最常用的两种结构模块。',
  definition: '{"term":"认知负荷","def":"人在处理信息时心智资源的总消耗量。排版的核心目标之一就是将认知负荷降到最低，让读者能专注于内容本身。","termLabel":"UX 术语"}',
  'quote-card': '{"quote":"如果你不能向一个六岁孩子解释清楚，那你就是没真正理解。","author":"理查德·费曼","title":"诺贝尔物理学奖得主","avatar":""}',
  tweet: '{"name":"独立开发者周刊","handle":"@indiedev","verified":true,"text":"MarkFlow 的模块化排版彻底改变了我的内容工作流。以前公众号排版要 2 小时，现在写好 Markdown、套上模块、复制粘贴，10 分钟搞定。关键是样式还能保持一致——这在以前根本不敢想。","timestamp":"2026-06-15","likes":"2.4K","retweets":"586","replies":"127"}',
  'stat-row': '[{"label":"覆盖模块数","value":"61 个","trend":"+18","color":"accent"},{"label":"支持主题","value":"52 套","trend":"+4 套","color":"default"},{"label":"平均导出耗时","value":"0.8s","trend":"-40%","color":"accent"},{"label":"月活创作者","value":"12K+","trend":"+23%","color":"default"}]',
  question: '[{"q":"排版模块和 Markdown 扩展语法是什么关系？","a":"排版模块是 Markdown 的自定义容器扩展（:::name），在标准 Markdown 基础上增加了结构化排版能力，同时保持纯文本可读性。"},{"q":"我可以在一个模块里嵌套另一个模块吗？","a":"目前不支持嵌套，但可以将多个模块按顺序排列。每个模块的 body 区域支持标准 Markdown 语法。"},{"q":"导出的富文本能在其他平台使用吗？","a":"导出的 HTML 使用内联样式（inline style），兼容微信公众号、知乎、语雀、Notion 等主流平台。"}]',
  'resource-list': '[{"title":"MarkFlow 使用指南 v2.0","desc":"从零到一掌握所有模块和主题的完整教程","url":"#","type":"pdf"},{"title":"排版认知科学白皮书","desc":"为什么结构化排版能提升阅读完成率——来自认知心理学的证据","url":"#","type":"link"},{"title":"示例模板库","desc":"10 套可直接复用的排版模板，覆盖观点文、教程、周报等场景","url":"#","type":"download"}]',
  'comparison-table': '{"headers":["对比维度","传统手工排版","MarkFlow 模块化"],"rows":[["上手时间","2-4 周","10 分钟"],["品牌一致性","依赖设计师手感","52 套主题自动保证"],["移动端适配","需逐篇调整","所有模块内置适配"],["导出格式","公众号富文本","富文本 + 长图 + A4 文档 + 卡片"],["协作难度","高（样式易丢失）","低（Markdown 纯文本）"]]}',
  changelog: '{"version":"v2.5.0","date":"2026-07-31","added":["新增 4 套主题：摸鱼绿、石墨极简、留白禅意、橄榄手记","公众号草稿箱发布配置与命令生成","组件库按渲染样式自动去重"],"changed":["主题总数为 52 套","组件库分类映射完善"],"fixed":["组件库分类正确映射到 11 个功能分组"]}',
};

const categories = [
  { key: 'all', label: '全部' },
  { key: 'title', label: '标题' },
  { key: 'intro', label: '开篇引导' },
  { key: 'structure', label: '结构导航' },
  { key: 'content', label: '正文内容' },
  { key: 'data', label: '数据流程' },
  { key: 'image', label: '图文媒体' },
  { key: 'emph', label: '强调引用' },
  { key: 'cards', label: '卡片' },
  { key: 'cta', label: '行动引导' },
  { key: 'inline', label: '行内元素' },
  { key: 'other', label: '其他' },
];

function getComponentCategory(id: string): string {
  return componentCategoryMap[id] || 'other';
}

/**
 * 基于渲染 HTML 的样式指纹去重
 * 提取标签结构 + style 属性作为指纹，忽略文本内容，判断两个组件视觉样式是否重复
 */
function styleFingerprint(html: string): string {
  if (!html) return ''
  // 移除所有文本内容，只保留标签结构 + style 属性值
  return html
    .replace(/>(.*?)</gs, '><')               // 移除标签之间的文本
    .replace(/style="[^"]*"/g, (m) => {        // 保留 style 属性但移除 color 值（避免主题色差异导致误判）
      return m.replace(/\$\{[^}]+\}|var\([^)]+\)|\#[0-9a-f]{3,8}\b/gi, '')
    })
    .replace(/\s+/g, ' ')                       // 压缩空白
    .trim()
}

function deduplicateByStyle(examples: ComponentExample[]): ComponentExample[] {
  const seen = new Map<string, number>()
  const result: ComponentExample[] = []
  for (const ex of examples) {
    const fp = styleFingerprint(ex.rendered)
    if (!fp) { result.push(ex); continue }
    const existing = seen.get(fp)
    if (existing === undefined) {
      seen.set(fp, result.length)
      result.push(ex)
    }
    // 跳过重复项（样式指纹相同）
  }
  return result
}

const componentCategoryMap: Record<string, string> = {
  // -- tag-based component IDs (def.id) --
  Title_DA01: 'title', Title_DA02: 'title', PTitle_DA01: 'title',
  Lead_DA01: 'intro',
  CTA_DA01: 'cta', Engage_DA01: 'cta', Engage_DA02: 'cta',
  Statement_DA01: 'emph',
  Img_DA01: 'image',
  Badge_DA01: 'inline', Badges_DA01: 'inline', Icon_DA01: 'inline',
  // -- unified component spec names --
  'reading-path': 'structure', breaking: 'emph',
  'steps-horizontal': 'data', 'steps-vertical': 'data',
  'case-flow': 'content',
  timeline: 'data', slider: 'image', 'gov-header': 'other',
  callout: 'content', table: 'data', 'code-block': 'content', hint: 'content', align: 'content',
  // -- layout module spec names (with "layout-" prefix to avoid collision with unified) --
  'layout-hero': 'intro',
  'layout-toc': 'structure', 'layout-cards': 'intro', 'layout-part': 'structure',
  'layout-label-title': 'title',
  'layout-metrics': 'data', 'layout-infographic': 'data', 'layout-compare': 'data',
  'layout-steps': 'data', 'layout-timeline': 'data', 'layout-checklist': 'content',
  'layout-stat-row': 'data', 'layout-comparison-table': 'data',
  'layout-image-annotate': 'image', 'layout-image-compare': 'image',
  'layout-image-steps': 'image', 'layout-image-text': 'image',
  'layout-verdict': 'emph', 'layout-audience-fit': 'emph', 'layout-myth-fact': 'emph',
  'layout-manifesto': 'emph', 'layout-bridge': 'emph', 'layout-quote': 'emph',
  'layout-quote-card': 'emph', 'layout-tweet': 'cards',
  'layout-question': 'content', 'layout-faq': 'content',
  'layout-summary': 'content', 'layout-notice': 'emph', 'layout-definition': 'cards',
  'layout-cases': 'cards', 'layout-author-card': 'cards', 'layout-subscribe': 'cards',
  'layout-people': 'cards', 'layout-series': 'cards', 'layout-resource-list': 'content',
  'layout-callout': 'content',
  'layout-changelog': 'other',
};

interface ComponentExample {
  def: ComponentDef | UnifiedComponentDef;
  rendered: string;
  id: string;
}

function viewDef(d: ComponentDef | UnifiedComponentDef) {
  if ('spec' in d) {
    return { name: d.spec.label, tag: `:::${d.spec.name}`, example: d.spec.example || '' };
  }
  return { name: d.name, tag: `<${d.tag}>`, example: d.example || '' };
}

function parseExampleTag(example: string): { attrs: Record<string, string>; body: string } {
  const attrs: Record<string, string> = {};
  const openMatch = example.match(/^<([A-Za-z_][\w.-]*)([^>]*)>/);
  if (!openMatch) return { attrs, body: example };
  const tagName = openMatch[1];
  const attrStr = openMatch[2].trim();
  if (attrStr) {
    const attrRe = /([A-Za-z_][\w.-]*)="([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrStr))) { attrs[m[1]] = m[2]; }
  }
  const openEnd = openMatch[0].length;
  const closeTag = `</${tagName}>`;
  const closeIdx = example.lastIndexOf(closeTag);
  const body = closeIdx > openEnd ? example.slice(openEnd, closeIdx).trim() : '';
  return { attrs, body };
}

interface ExtensionPageProps {
  onClose: () => void;
}

export function ExtensionPage({ onClose }: ExtensionPageProps) {
  const colors = useStore((s) => s.colors);
  const [activeCategory, setActiveCategory] = useState('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [examples, setExamples] = useState<ComponentExample[]>([]);

  useEffect(() => {
    const tagExamples = components
      .filter((c) => c.example)
      .map((def) => {
        try {
          const { attrs, body } = parseExampleTag(def.example!);
          return { def, rendered: def.render.call(def, attrs, body, colors), id: def.id };
        } catch (err) {
          console.error(`[ExtensionPage] render failed for ${def.id}:`, err);
          return { def, rendered: '', id: def.id };
        }
      });
    const unifiedExamples = unifiedComponents
      .filter((c) => c.spec.example)
      .map((def: UnifiedComponentDef) => {
        try {
          return { def, rendered: renderPreview(def, colors), id: def.spec.name };
        } catch (err) {
          console.error(`[ExtensionPage] render failed for ${def.spec.name}:`, err);
          return { def, rendered: '', id: def.spec.name };
        }
      });
    const themeTokens = useAppStore.getState().themeTokens;
    const tokensRaw = resolveTokens();
    const layoutCtx: BlockRenderContext = {
      t: colors,
      tokens: themeTokens ?? tokensRaw,
      tokensRaw,
      md: '',
      pTitleLevel1List: [],
    };
    const layoutExamples = layoutModuleSpecs.map((spec: LayoutModuleSpec) => {
      const example = LAYOUT_EXAMPLES[spec.name] ?? fallbackExample(spec.bodyFormat);
      const wrapperText = `:::${spec.name}\n${example}\n:::`;
      const lines = wrapperText.split('\n');
      const renderer = layoutRendererByName[spec.name];
      let html = '';
      if (renderer) {
        try {
          const result = renderer.render(layoutCtx, lines[0], lines, 0);
          html = result?.html ?? '';
        } catch (err) {
          console.error(`[ExtensionPage] layout render failed for ${spec.name}:`, err);
        }
      }
      const fakeDef = { spec: { name: spec.name, label: spec.label, bodyFormat: spec.bodyFormat, example }, render: () => '', renderLegacy: () => '' } as unknown as UnifiedComponentDef;
      return { def: fakeDef, rendered: html, id: `layout-${spec.name}` };
    });
    const all = [...tagExamples, ...unifiedExamples, ...layoutExamples]
    const deduplicated = deduplicateByStyle(all)
    if (deduplicated.length < all.length) {
      console.log(`[ExtensionPage] 样式去重: ${all.length} → ${deduplicated.length} 个组件`)
    }
    setExamples(deduplicated);
  }, [colors]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return examples;
    return examples.filter((e) => getComponentCategory(e.id) === activeCategory);
  }, [examples, activeCategory]);

  const handleCopy = useCallback(async (code: string) => {
    const ok = await copyText(code);
    if (ok) { setToast('已复制到剪贴板'); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 1500); }
  }, []);

  const handleInsert = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent('m2v-editor-insert', { detail: { text: code } }));
    setToast('已插入到编辑器'); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">扩展组件</h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">浏览和使用丰富的排版组件</p>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2 px-6 py-3 border-b border-slate-100 bg-white shrink-0 flex-wrap">
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all cursor-pointer ${activeCategory === cat.key ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-transparent text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'}`}>
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="columns-2 gap-5 max-w-[900px] mx-auto max-[1024px]:columns-1">
          {filtered.map((ex) => (
            <SpotlightCard key={ex.id} example={ex} onCopy={handleCopy} onInsert={handleInsert} />
          ))}
        </div>
      </div>
      <Toast toast={toast ? { message: toast, key: Date.now() } : null} />
    </div>
  );
}

function SpotlightCard({ example, onCopy, onInsert }: { example: ComponentExample; onCopy: (code: string) => void; onInsert: (code: string) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { def, rendered } = example;
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);
  const CopyIcon = () => (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
    </svg>
  );
  return (
    <div ref={cardRef} className="group relative break-inside-avoid mb-5 inline-block w-full rounded-2xl bg-white border border-slate-200 shadow-sm cursor-default overflow-hidden" style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties} onMouseMove={handleMouseMove}>
      <div className="absolute inset-0 z-[3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none spotlight-glow" style={{ background: 'radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), rgba(var(--accent-rgb,108,92,231),0.12), rgba(var(--accent-rgb,108,92,231),0.04) 40%, transparent 70%)' }} />
      <div className="relative z-[1]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">{viewDef(def).name}</span>
            <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{viewDef(def).tag}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {viewDef(def).example && (
              <button onClick={() => onInsert(viewDef(def).example)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600 cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M3 8h10" /></svg>
                插入
              </button>
            )}
            {viewDef(def).example && (
              <button onClick={() => onCopy(viewDef(def).example)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-[var(--accent)]/5 text-[10px] text-[var(--accent)] cursor-pointer hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all">
                <CopyIcon />复制
              </button>
            )}
            {viewDef(def).example && (
              <button onClick={() => setShowDetails((v) => !v)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] cursor-pointer transition-all ${showDetails ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}><path d="M4 6l4 4 4-4" /></svg>
              </button>
            )}
          </div>
        </div>
        <div className="px-5 pb-4">
          {rendered ? (
            <div className="preview-content max-w-full [&_section]:transition-opacity [&_section]:duration-150" dangerouslySetInnerHTML={{ __html: sanitizeHtml(rendered) }} />
          ) : (
            <div className="text-xs text-slate-300 italic py-8 text-center">暂无示例</div>
          )}
        </div>
        {showDetails && (
          <div className="px-5 pb-5 space-y-4 transition-all duration-150">
            {viewDef(def).example && (
              <div>
                <pre className="m-0 p-3 bg-[#1e1e2e] rounded-xl border border-white/5 text-[#e0e0e0] font-mono text-[11px] leading-6 overflow-auto whitespace-pre-wrap break-all max-h-40"><code>{viewDef(def).example}</code></pre>
              </div>
            )}
            {'attrs' in def && def.attrs && def.attrs.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden text-[11px]">
                <div className="grid grid-cols-[90px_1fr] bg-[var(--accent)]/5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  <span className="px-2.5 py-1.5">属性</span>
                  <span className="px-2.5 py-1.5">说明</span>
                </div>
                {def.attrs.map((attr) => (
                  <div key={attr.key} className="grid grid-cols-[90px_1fr] border-t border-slate-100">
                    <span className="px-2.5 py-1.5 flex items-center">
                      <code className="font-mono text-[11px] text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{attr.key}</code>
                      {attr.required && <span className="text-[9px] text-red-500 ml-1 font-semibold">必填</span>}
                    </span>
                    <span className="px-2.5 py-1.5 text-slate-500 text-[11px] leading-5 flex flex-wrap items-center">
                      {attr.label}
                      {attr.default && <>, 默认 <code className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-1 rounded">{attr.default}</code></>}
                      {(attr.options?.length ?? 0) > 0 && <>, 可选 {attr.options!.map((opt, i) => <code key={opt} className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-1 rounded">{opt}{i < attr.options!.length - 1 ? ' / ' : ''}</code>)}</>}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {'spec' in def && (def.spec as any).fields && (def.spec as any).fields.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden text-[11px]">
                <div className="grid grid-cols-[90px_1fr] bg-[var(--accent)]/5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  <span className="px-2.5 py-1.5">字段</span>
                  <span className="px-2.5 py-1.5">说明</span>
                </div>
                {(def.spec as any).fields.map((f: any) => (
                  <div key={f.name} className="grid grid-cols-[90px_1fr] border-t border-slate-100">
                    <span className="px-2.5 py-1.5 flex items-center">
                      <code className="font-mono text-[11px] text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{f.name}</code>
                      {f.required && <span className="text-[9px] text-red-500 ml-1 font-semibold">必填</span>}
                    </span>
                    <span className="px-2.5 py-1.5 text-slate-500 text-[11px] leading-5">{f.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
