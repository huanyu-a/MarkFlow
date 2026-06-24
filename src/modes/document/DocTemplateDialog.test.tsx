import { describe, it, expect } from 'vitest'
import { fillTemplateSkeleton, TECH_DOC_TEMPLATE, GOV_DOC_TEMPLATE } from './docTemplates'

describe('fillTemplateSkeleton', () => {
  it('应正确填充技术文档模板', () => {
    const result = fillTemplateSkeleton(TECH_DOC_TEMPLATE, {
      title: '测试文档',
      docNo: 'TEST-001',
      version: 'V1.0',
      hasCover: 'true',
    })
    expect(result).toContain('# 测试文档')
    expect(result).toContain('TEST-001')
    expect(result).toContain('V1.0')
    expect(result).toContain('<page-break/>')
  })

  it('应正确填充公文文档模板', () => {
    const result = fillTemplateSkeleton(GOV_DOC_TEMPLATE, {
      title: '关于测试的通知',
      issuer: '测试机关',
      docNo: '测试〔2026〕1号',
      recipient: '各区人民政府',
    })
    expect(result).toContain('<gov-header')
    expect(result).toContain('issuer="测试机关"')
    expect(result).toContain('doc-no="测试〔2026〕1号"')
    expect(result).toContain('# 关于测试的通知')
    expect(result).toContain('各区人民政府：')
  })

  it('未填写的字段应替换为空字符串', () => {
    const result = fillTemplateSkeleton(GOV_DOC_TEMPLATE, {
      title: '测试',
      issuer: '测试机关',
    })
    expect(result).not.toContain('{docNo}')
    expect(result).not.toContain('{signer}')
  })

  it('空值属性应清理为无值属性', () => {
    const result = fillTemplateSkeleton(GOV_DOC_TEMPLATE, {
      title: '测试',
      issuer: '测试机关',
      classification: '',
    })
    expect(result).not.toContain('classification=""')
  })
})
