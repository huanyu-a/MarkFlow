/**
 * AI 排版技能系统：将引擎的行内标识与块级组件转化为 AI 可理解的技能描述。
 * AI 携带这些技能描述读取编辑器内容，为内容匹配合适的组件进行排版增强。
 */

import { components, type ComponentDef } from '@engine'
import type { RenderMode } from '@/lib/store'

/** 一个 AI 排版技能的描述 */
export interface AiSkill {
  id: string
  name: string
  tag: string
  /** 技能分类：inline = 行内标识，block = 块级组件 */
  category: 'inline' | 'block'
  /** AI 可理解的技能描述（含语法、示例、属性） */
  description: string
}

/** 已知的行内标识技能（非引擎组件，由 Markdown 解析器直接支持） */
const INLINE_SKILLS: AiSkill[] = [
  {
    id: 'inline-highlight',
    name: '渐变背景强调',
    tag: '==',
    category: 'inline',
    description: '语法：==文字==\n效果：主题色渐变背景强调（强调强度大于加粗）',
  },
  {
    id: 'inline-badge',
    name: '胶囊标签',
    tag: '!!',
    category: 'inline',
    description: '语法：!!文字!!\n效果：圆角药丸标签背景',
  },
  {
    id: 'inline-strong-em',
    name: '加重强调',
    tag: '^^',
    category: 'inline',
    description: '语法：^^文字^^\n效果：靛青/主题色加重强调',
  },
  {
    id: 'inline-soft',
    name: '柔光重点',
    tag: '::',
    category: 'inline',
    description: '语法：::文字::\n效果：柔光主题色重点文字',
  },
  {
    id: 'inline-underline',
    name: '主题色下划线',
    tag: '__',
    category: 'inline',
    description: '语法：__文字__\n效果：主题色下划线',
  },
]

function renderAttrsForSkill(attrs: ComponentDef['attrs']): string {
  if (!attrs || attrs.length === 0) return '（无属性）'
  return attrs
    .map((a) => {
      const req = a.required ? '必填' : '可选'
      const def = a.default ? `，默认：${a.default}` : ''
      const opts = a.options?.length ? `，可选值：${a.options.join(' / ')}` : ''
      return `- ${a.key}（${req}）${a.label}${def}${opts}`
    })
    .join('\n')
}

function componentToSkill(c: ComponentDef): AiSkill {
  const parts: string[] = []
  parts.push(`标签：<${c.tag}>`)
  if (c.example) parts.push(`示例：\n${c.example}`)
  parts.push(`属性：\n${renderAttrsForSkill(c.attrs)}`)

  return {
    id: c.id,
    name: c.name,
    tag: c.tag,
    category: 'block',
    description: parts.join('\n'),
  }
}

/** 获取所有块级组件技能 */
export function getBlockSkills(): AiSkill[] {
  return components.map(componentToSkill)
}

/** 获取所有行内标识技能 */
export function getInlineSkills(): AiSkill[] {
  return INLINE_SKILLS
}

/** 获取全部可用技能 */
export function getAllSkills(): AiSkill[] {
  return [...INLINE_SKILLS, ...getBlockSkills()]
}

/** 将选中的技能列表转化为 AI 可读的技能描述文本 */
export function buildSkillsPrompt(skills: AiSkill[]): string {
  if (skills.length === 0) return '（未选择任何技能）'

  const inlineSkills = skills.filter((s) => s.category === 'inline')
  const blockSkills = skills.filter((s) => s.category === 'block')

  const sections: string[] = []

  if (inlineSkills.length > 0) {
    sections.push(
      '### 行内强调语法\n\n' +
        inlineSkills.map((s) => `- ${s.name}：${s.description}`).join('\n'),
    )
  }

  if (blockSkills.length > 0) {
    // 按 tag 分组
    const groups = new Map<string, AiSkill[]>()
    for (const s of blockSkills) {
      const list = groups.get(s.tag) ?? []
      list.push(s)
      groups.set(s.tag, list)
    }

    const blocks: string[] = []
    let idx = 1
    for (const [tag, list] of groups) {
      const names = list.map((s) => s.name).join(' / ')
      blocks.push(`### ${idx}. <${tag}> ${names}\n\n${list.map((s) => s.description).join('\n\n')}`)
      idx++
    }

    sections.push('### 块级组件\n\n' + blocks.join('\n\n---\n\n'))
  }

  return sections.join('\n\n')
}

/** 根据当前模式获取 AI 排版的基础上下文指令 */
export function buildModeContextPrompt(mode: RenderMode): string {
  switch (mode) {
    case 'article':
      return [
        '你是一位专业的长图文内容策划与排版助手。',
        '请阅读用户提供的 Markdown 内容，使用下方「可用排版技能」为其匹配最适合的行内标识和块级组件，增强文章的视觉表现力和可读性。',
        '',
        '## 输出要求',
        '1. 只输出增强后的 Markdown 正文，不要有任何额外解释。',
        '2. 不要发明新标签或新属性，只使用「可用排版技能」中列出的语法。',
        '3. 合理搭配组件：开头可用 <title> 或 <breaking>，结尾推荐 <engage>，正文穿插 <steps>、<timeline> 等增强可读性。',
        '4. <statement> 仅在高度总结的核心金句时克制使用。',
        '5. 保留原文的信息和结构，不要删减或改变核心内容。',
        '6. 代码块必须标注语言（如 ```javascript）。',
      ].join('\n')
    case 'document':
      return [
        '你是一位专业的 A4 正式文档编辑与排版助手。',
        '请阅读用户提供的 Markdown 内容，优化其结构和排版，使其适合打印、归档和评审。',
        '',
        '## 输出要求',
        '1. 只输出增强后的 Markdown 正文，不要有任何额外解释。',
        '2. 保持文档正式、严谨、适合打印和归档的风格。',
        '3. 在需要分页处插入 <page-break />。附录前必须分页。',
        '4. 不要使用社交互动组件（如 <breaking>、<timeline>、<engage> 等）。',
        '5. 保留原文的信息和结构，不要删减核心内容。',
      ].join('\n')
    case 'card':
      return [
        '你是一位专业的小红书图文卡片内容策划助手。',
        '请阅读用户提供的 Markdown 内容，将其优化为适合小红书发布的分页图文卡片稿。',
        '',
        '## 输出要求',
        '1. 只输出增强后的 Markdown 正文，不要有任何额外解释。',
        '2. 使用短段落、清晰小标题和列表，每张图只承载一个重点。',
        '3. 不要使用长图文模式的复杂社交组件。',
        '4. 需要强调时使用 ==重点==、!!标签!!、^^强强调^^ 等行内语法。',
        '5. 保留原文的核心信息。',
      ].join('\n')
    case 'html':
      return [
        '你是一位专业的 HTML 内容排版助手。',
        '请阅读用户提供的内容，使用下方「可用排版技能」为其进行排版增强。',
        '',
        '## 输出要求',
        '1. 只输出增强后的内容，不要有任何额外解释。',
        '2. 只使用「可用排版技能」中列出的语法。',
        '3. 保留原文的核心信息。',
      ].join('\n')
  }
}
