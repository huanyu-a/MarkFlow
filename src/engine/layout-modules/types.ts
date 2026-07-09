/**
 * 排版模块公共类型
 */

import type { BlockRenderer } from '../utils/blockRenderRegistry'
import type { BodyFormat } from './parse'

export type ModuleCategory =
  | 'opening'
  | 'infographic'
  | 'judgment'
  | 'evidence'
  | 'conversion'
  | 'brand'
  | 'sprint4'

export type ModuleServes = 'attention' | 'readability' | 'memorability' | 'conversion'

export interface LayoutModuleSpec {
  name: string
  category: ModuleCategory
  serves: ModuleServes[]
  bodyFormat: BodyFormat
  /** 模块展示名（中文） */
  label: string
  /** 字段描述（可选，用于文档/校验提示） */
  fields?: { name: string; required: boolean; description: string }[]
}

/**
 * 一个排版模块 = 一段 spec（元信息）+ 一个 block renderer。
 * index.ts 会收集所有模块，统一注册到 createDefaultBlockRenderers。
 */
export interface LayoutModule {
  spec: LayoutModuleSpec
  renderer: BlockRenderer
}
