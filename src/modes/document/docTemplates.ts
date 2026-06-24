/**
 * 文档模板体系：JSON Schema + Markdown 骨架
 *
 * 每个模板定义：
 * - id: 模板唯一标识
 * - name: 模板名称
 * - description: 模板描述
 * - category: 模板分类（技术文档 / 公文文档）
 * - fields: 字段定义数组（用于表单渲染）
 * - skeleton: Markdown 骨架（含 {fieldKey} 占位符）
 */

export type TemplateFieldType = 'text' | 'date' | 'select' | 'boolean'

export interface TemplateField {
  key: string
  label: string
  type: TemplateFieldType
  required?: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string
}

export interface DocTemplate {
  id: string
  name: string
  description: string
  category: '技术文档' | '公文文档'
  fields: TemplateField[]
  skeleton: string
}

/** 技术文档模板 */
export const TECH_DOC_TEMPLATE: DocTemplate = {
  id: 'tech-doc',
  name: '技术文档',
  description: '适合 PRD、技术方案、设计文档等，支持封面元数据',
  category: '技术文档',
  fields: [
    { key: 'title', label: '文档标题', type: 'text', required: true, placeholder: '请输入文档标题' },
    { key: 'docNo', label: '文档编号', type: 'text', placeholder: '如 PRD-2026-001' },
    { key: 'version', label: '版本号', type: 'text', placeholder: '如 V1.0' },
    { key: 'author', label: '编写者', type: 'text', placeholder: '编写人姓名' },
    { key: 'authorDate', label: '编写日期', type: 'date' },
    { key: 'reviewer', label: '审核者', type: 'text', placeholder: '审核人姓名' },
    { key: 'reviewDate', label: '审核日期', type: 'date' },
    {
      key: 'status',
      label: '文档状态',
      type: 'select',
      options: ['草稿', '评审中', '已发布', '已归档'],
      defaultValue: '草稿',
    },
    {
      key: 'classification',
      label: '机密等级',
      type: 'select',
      options: ['绝密', '机密', '内部公开', '授权公开', '公开'],
      defaultValue: '内部公开',
    },
    { key: 'hasCover', label: '生成封面页', type: 'boolean', defaultValue: 'true' },
  ],
  skeleton: `# {title}

| 文档编号 | {docNo} | 版本号 | {version} |
| --- | --- | --- | --- |
| 编写 | {author} | 编写日期 | {authorDate} |
| 审核 | {reviewer} | 审核日期 | {reviewDate} |
| 文档状态 | {status} | 机密等级 | {classification} |

<page-break/>

## 一、背景与目标

## 二、方案设计

## 三、实施计划

## 附录
`,
}

/** 公文文档模板 */
export const GOV_DOC_TEMPLATE: DocTemplate = {
  id: 'gov-doc',
  name: '公文文档',
  description: '符合 GB/T 9704-2012 标准的党政机关公文',
  category: '公文文档',
  fields: [
    { key: 'title', label: '公文标题', type: 'text', required: true, placeholder: '关于XXX的通知' },
    { key: 'issuer', label: '发文机关', type: 'text', required: true, placeholder: 'XX市人民政府办公厅' },
    { key: 'docNo', label: '发文字号', type: 'text', placeholder: '如 市政发〔2026〕第1号' },
    {
      key: 'classification',
      label: '密级',
      type: 'select',
      options: ['', '绝密', '机密', '秘密'],
    },
    {
      key: 'urgency',
      label: '紧急程度',
      type: 'select',
      options: ['', '特急', '加急'],
    },
    { key: 'signer', label: '签发人', type: 'text', placeholder: '签发人姓名（上行文）' },
    { key: 'recipient', label: '主送机关', type: 'text', placeholder: '如 各区人民政府，市政府各委、办、局' },
    { key: 'publishDate', label: '成文日期', type: 'date' },
  ],
  skeleton: `<gov-header issuer="{issuer}" doc-no="{docNo}" classification="{classification}" urgency="{urgency}" signer="{signer}"></gov-header>

# {title}

{recipient}：

## 一、

## 二、

## 三、

{issuer}
{publishDate}
`,
}

export const DOC_TEMPLATES: DocTemplate[] = [TECH_DOC_TEMPLATE, GOV_DOC_TEMPLATE]

/** 根据字段值填充 Markdown 骨架 */
export function fillTemplateSkeleton(template: DocTemplate, values: Record<string, string>): string {
  let result = template.skeleton
  for (const field of template.fields) {
    const value = values[field.key] ?? ''
    result = result.replaceAll(`{${field.key}}`, value)
  }
  // 清理空值导致的多余空格（如 classification="" 时属性留空）
  result = result.replace(/(\w+)=""/g, '$1')
  return result
}
