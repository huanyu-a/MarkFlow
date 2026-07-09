/**
 * 统一 ::: 容器 renderer 注册表
 *
 * 收集所有多行基础组件的 `:::` 容器 renderer，供 blockRenderRegistry 注册。
 * 每个组件文件导出 `xxxRenderer = buildUnifiedRenderer(Xxx_DAxx)`，
 * 本文件统一收集并导出 `unifiedRenderers` 数组。
 */

import { stepsHorizontalRenderer } from './Steps_DA01'
import { stepsVerticalRenderer } from './Steps_DA02'
import { timelineRenderer } from './Timeline_DA01'
import { breakingRenderer } from './Breaking_DA01'
import { govHeaderRenderer } from './GovHeader_DA01'
import { readingPathRenderer } from './ReadingPath_DA01'
import { alignRenderer } from './Align_DA01'
import { sliderRenderer } from './Slider_DA01'
import { caseFlowRenderer } from './LabeledFlow_DA01'
import { calloutRenderer } from './Callout_DA01'
import { codeBlockRenderer } from './CodeBlock_DA01'
import { tableRenderer } from './Table_DA01'
import { hintRenderer } from './HintContainer_DA01'

export const unifiedRenderers = [
  stepsHorizontalRenderer,
  stepsVerticalRenderer,
  timelineRenderer,
  breakingRenderer,
  govHeaderRenderer,
  readingPathRenderer,
  alignRenderer,
  sliderRenderer,
  caseFlowRenderer,
  calloutRenderer,
  codeBlockRenderer,
  tableRenderer,
  hintRenderer,
]
