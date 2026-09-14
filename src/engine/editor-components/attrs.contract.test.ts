/**
 * 声明 ⊆ 消费 契约测试
 *
 * 组件声明的属性（ComponentDef.attrs[].key / UnifiedComponentDef.spec.fields[].name）
 * 必须在渲染实现源码中被消费（attrs.xxx / attrs['xxx'] / 解构），否则该声明就是对用户的
 * 空头承诺——用户按文档写的属性会被静默忽略。由容器路由或公共 helper 消费的 key 走显式
 * allowlist（如 Title 的 type 由 titleRenderer 路由 DA01/DA02）。
 *
 * 任一「声明但未消费」即红灯，防止 table 的 title 这类静默丢失再次发生。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { components, unifiedComponents } from './index'

/** 本目录（相对仓库根） */
const DIR = join(process.cwd(), 'src', 'engine', 'editor-components')

/** 统一 ::: 组件 spec.name → 实现源文件（文件名与 spec.name 不同名，需显式登记） */
const UNIFIED_FILE: Record<string, string> = {
  'reading-path': './ReadingPath_DA01.ts',
  breaking: './Breaking_DA01.ts',
  'steps-horizontal': './Steps_DA01.ts',
  'steps-vertical': './Steps_DA02.ts',
  'case-flow': './LabeledFlow_DA01.ts',
  timeline: './Timeline_DA01.ts',
  slider: './Slider_DA01.ts',
  'gov-header': './GovHeader_DA01.ts',
  callout: './Callout_DA01.ts',
  table: './Table_DA01.ts',
  'code-block': './CodeBlock_DA01.ts',
  hint: './HintContainer_DA01.ts',
  align: './Align_DA01.ts',
}

/**
 * allowlist：key 由容器路由 / 公共 helper 消费，而非组件自身源码。
 * 值注明消费方，新增条目必须说明理由。
 */
const ALLOW: Record<string, Record<string, string>> = {
  Title_DA01: { type: 'titleRenderer 按 type 路由 DA01/DA02，组件本身不读' },
  Title_DA02: { type: 'titleRenderer 按 type 路由 DA01/DA02，组件本身不读' },
}

interface ContractCase {
  name: string
  file: string
  keys: string[]
  allow: Record<string, string>
}

function buildCases(): ContractCase[] {
  const cases: ContractCase[] = []
  for (const c of components) {
    if (!c.attrs?.length) continue
    cases.push({
      name: c.id,
      file: join(DIR, `${c.id}.ts`),
      keys: c.attrs.map((a) => a.key),
      allow: ALLOW[c.id] ?? {},
    })
  }
  for (const d of unifiedComponents) {
    const keys = (d.spec.fields ?? []).map((f) => f.name)
    if (!keys.length) continue
    const file = UNIFIED_FILE[d.spec.name]
    if (!file) throw new Error(`attrs.contract: 未登记统一组件 ${d.spec.name} 的源文件映射`)
    cases.push({
      name: `:::${d.spec.name}`,
      file: join(DIR, file),
      keys,
      allow: ALLOW[d.spec.name] ?? {},
    })
  }
  return cases
}

/** 声明 key 是否在源码中被消费：attrs.key / attrs?.key / attrs['key'] / 解构 { key, ... } */
function isConsumed(source: string, key: string): boolean {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [
    new RegExp(`attrs\\.${k}\\b`),
    new RegExp(`attrs\\?\\.${k}\\b`),
    new RegExp(`attrs\\[\\s*['"]${k}['"]\\s*\\]`),
    new RegExp(`\\{\\s*${k}\\s*[,}]`),
  ].some((re) => re.test(source))
}

const CASES = buildCases()

describe('组件属性「声明 ⊆ 消费」契约', () => {
  it('契约用例非空（防止注册表失配后测试空转）', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(12)
    // 至少覆盖 table 的四个声明
    expect(CASES.find((c) => c.name === ':::table')?.keys).toEqual(
      expect.arrayContaining(['style', 'title', 'caption', 'footer']),
    )
  })

  it.each(CASES.map((c) => [c.name, c] as const))('%s 声明的每个属性都被渲染实现消费', (_name, c) => {
    const source = readFileSync(c.file, 'utf8')
    const missing = c.keys.filter((key) => !c.allow[key] && !isConsumed(source, key))
    expect(missing, `${c.name} 声明但未被消费的属性（应消费或加入 ALLOW 并说明理由）`).toEqual([])
  })
})
