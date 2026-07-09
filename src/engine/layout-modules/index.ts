/**
 * 排版模块统一注册入口
 *
 * 导出 layoutModuleRenderers 数组，由 blockRenderRegistry 的
 * createDefaultBlockRenderers 统一注册。
 */

import type { BlockRenderer } from '../utils/blockRenderRegistry'
import type { LayoutModule } from './types'

// ── opening ──
import { heroModule } from './opening/hero'
import { tocModule } from './opening/toc'
import { cardsModule } from './opening/cards'
import { partModule } from './opening/part'
import { labelTitleModule } from './opening/label-title'

// ── infographic ──
import { metricsModule } from './infographic/metrics'
import { infographicModule } from './infographic/infographic'
import { compareModule } from './infographic/compare'
import { stepsModule } from './infographic/steps'
import { timelineModule } from './infographic/timeline'

// ── judgment ──
import { verdictModule } from './judgment/verdict'
import { audienceFitModule } from './judgment/audience-fit'
import { mythFactModule } from './judgment/myth-fact'
import { manifestoModule } from './judgment/manifesto'
import { bridgeModule } from './judgment/bridge'

// ── evidence ──
import { quoteModule } from './evidence/quote'
import { imageAnnotateModule } from './evidence/image-annotate'
import { imageCompareModule } from './evidence/image-compare'
import { imageStepsModule } from './evidence/image-steps'
import { imageTextModule } from './evidence/image-text'

// ── conversion ──
import { faqModule } from './conversion/faq'
import { checklistModule } from './conversion/checklist'
import { casesModule } from './conversion/cases'
import { summaryModule } from './conversion/summary'
import { noticeModule } from './conversion/notice'

// ── brand ──
import { authorCardModule } from './brand/author-card'
import { subscribeModule } from './brand/subscribe'
import { peopleModule } from './brand/people'
import { seriesModule } from './brand/series'

// ── sprint4 ──
import { calloutModule } from './sprint4/callout'
import { definitionModule } from './sprint4/definition'
import { quoteCardModule } from './sprint4/quote-card'
import { tweetModule } from './sprint4/tweet'
import { statRowModule } from './sprint4/stat-row'
import { questionModule } from './sprint4/question'
import { resourceListModule } from './sprint4/resource-list'
import { comparisonTableModule } from './sprint4/comparison-table'
import { changelogModule } from './sprint4/changelog'

// ── 注册列表 ──

const ALL_MODULES: LayoutModule[] = [
  heroModule,
  tocModule,
  cardsModule,
  partModule,
  labelTitleModule,
  metricsModule,
  infographicModule,
  compareModule,
  stepsModule,
  timelineModule,
  verdictModule,
  audienceFitModule,
  mythFactModule,
  manifestoModule,
  bridgeModule,
  quoteModule,
  imageAnnotateModule,
  imageCompareModule,
  imageStepsModule,
  imageTextModule,
  faqModule,
  checklistModule,
  casesModule,
  summaryModule,
  noticeModule,
  authorCardModule,
  subscribeModule,
  peopleModule,
  seriesModule,
  calloutModule,
  definitionModule,
  quoteCardModule,
  tweetModule,
  statRowModule,
  questionModule,
  resourceListModule,
  comparisonTableModule,
  changelogModule,
]

/** 全部排版模块的 block renderer，供 createDefaultBlockRenderers 注册 */
export const layoutModuleRenderers: BlockRenderer[] = ALL_MODULES.map((m) => m.renderer)

/** 全部排版模块的 spec（供文档/UI 展示用） */
export const layoutModuleSpecs = ALL_MODULES.map((m) => m.spec)

/** spec.name → BlockRenderer 映射（供扩展面板预览渲染用） */
export const layoutRendererByName: Record<string, BlockRenderer> = Object.fromEntries(
  ALL_MODULES.map((m) => [m.spec.name, m.renderer]),
)
