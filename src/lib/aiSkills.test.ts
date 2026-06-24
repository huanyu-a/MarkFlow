import { describe, it, expect } from 'vitest'
import {
  getBlockSkills,
  getInlineSkills,
  getAllSkills,
  buildSkillsPrompt,
  buildModeContextPrompt,
} from './aiSkills'
import type { AiSkill } from './aiSkills'

/* ------------------------------------------------------------------ */
/*  getInlineSkills                                                     */
/* ------------------------------------------------------------------ */
describe('getInlineSkills', () => {
  it('应返回 5 个行内标识技能', () => {
    const skills = getInlineSkills()
    expect(skills).toHaveLength(5)
  })

  it('每个技能的 category 应为 inline', () => {
    for (const s of getInlineSkills()) {
      expect(s.category).toBe('inline')
    }
  })

  it('应包含已知的行内标识 tag', () => {
    const tags = getInlineSkills().map((s) => s.tag)
    expect(tags).toContain('==')
    expect(tags).toContain('!!')
    expect(tags).toContain('^^')
    expect(tags).toContain('::')
    expect(tags).toContain('__')
  })
})

/* ------------------------------------------------------------------ */
/*  getBlockSkills                                                      */
/* ------------------------------------------------------------------ */
describe('getBlockSkills', () => {
  it('返回的块级组件技能数量应大于 15', () => {
    const skills = getBlockSkills()
    expect(skills.length).toBeGreaterThan(15)
  })

  it('每个技能的 category 应为 block', () => {
    for (const s of getBlockSkills()) {
      expect(s.category).toBe('block')
    }
  })

  it('每个块级技能应包含 id、name、tag、description', () => {
    for (const s of getBlockSkills()) {
      expect(s.id).toBeTruthy()
      expect(s.name).toBeTruthy()
      expect(s.tag).toBeTruthy()
      expect(s.description).toBeTruthy()
    }
  })
})

/* ------------------------------------------------------------------ */
/*  getAllSkills                                                        */
/* ------------------------------------------------------------------ */
describe('getAllSkills', () => {
  it('返回的技能数量应等于 inline + block 之和', () => {
    const all = getAllSkills()
    const inline = getInlineSkills()
    const block = getBlockSkills()
    expect(all).toHaveLength(inline.length + block.length)
  })

  it('前 5 个应为行内技能，其余为块级技能', () => {
    const all = getAllSkills()
    const inlineCount = getInlineSkills().length
    for (let i = 0; i < inlineCount; i++) {
      expect(all[i].category).toBe('inline')
    }
    for (let i = inlineCount; i < all.length; i++) {
      expect(all[i].category).toBe('block')
    }
  })
})

/* ------------------------------------------------------------------ */
/*  buildSkillsPrompt                                                  */
/* ------------------------------------------------------------------ */
describe('buildSkillsPrompt', () => {
  it('空数组应返回占位文本', () => {
    expect(buildSkillsPrompt([])).toBe('（未选择任何技能）')
  })

  it('仅有行内技能时应包含 "### 行内强调语法" 标题', () => {
    const inline: AiSkill[] = getInlineSkills().slice(0, 2)
    const prompt = buildSkillsPrompt(inline)
    expect(prompt).toContain('### 行内强调语法')
    expect(prompt).not.toContain('### 块级组件')
  })

  it('仅有块级技能时应包含 "### 块级组件" 标题', () => {
    const block: AiSkill[] = getBlockSkills().slice(0, 2)
    const prompt = buildSkillsPrompt(block)
    expect(prompt).toContain('### 块级组件')
    expect(prompt).not.toContain('### 行内强调语法')
  })

  it('混合技能时两个分区标题均应出现', () => {
    const mixed: AiSkill[] = [...getInlineSkills().slice(0, 1), ...getBlockSkills().slice(0, 1)]
    const prompt = buildSkillsPrompt(mixed)
    expect(prompt).toContain('### 行内强调语法')
    expect(prompt).toContain('### 块级组件')
  })

  it('块级技能描述中应包含标签语法 <tag>', () => {
    const block = getBlockSkills().slice(0, 3)
    const prompt = buildSkillsPrompt(block)
    for (const s of block) {
      expect(prompt).toContain(`<${s.tag}>`)
    }
  })
})

/* ------------------------------------------------------------------ */
/*  buildModeContextPrompt                                             */
/* ------------------------------------------------------------------ */
describe('buildModeContextPrompt', () => {
  const modes = ['article', 'document', 'card', 'html'] as const

  it.each(modes)('模式 "%s" 应返回非空字符串', (mode) => {
    const result = buildModeContextPrompt(mode)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('article 模式应包含"长图文"关键词', () => {
    expect(buildModeContextPrompt('article')).toContain('长图文')
  })

  it('document 模式应包含"A4"关键词', () => {
    expect(buildModeContextPrompt('document')).toContain('A4')
  })

  it('card 模式应包含"小红书"关键词', () => {
    expect(buildModeContextPrompt('card')).toContain('小红书')
  })

  it('html 模式应包含"HTML"关键词', () => {
    expect(buildModeContextPrompt('html')).toContain('HTML')
  })

  it('每个模式均应包含"输出要求"章节', () => {
    for (const mode of modes) {
      expect(buildModeContextPrompt(mode)).toContain('## 输出要求')
    }
  })
})
