import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_TITLE_LINE_HEIGHT,
  DOCUMENT_TITLE_MARGIN,
  DOCUMENT_TITLE_STYLE_VARS,
} from './documentStyles'

describe('document A4 styles', () => {
  it('gives the document title more top spacing and looser line height', () => {
    expect(DOCUMENT_TITLE_LINE_HEIGHT).toBe('1.5')
    expect(DOCUMENT_TITLE_MARGIN).toBe('0.85em 0 1.55em')
    expect(DOCUMENT_TITLE_STYLE_VARS).toEqual({
      '--document-title-line-height': '1.5',
      '--document-title-margin': '0.85em 0 1.55em',
    })
  })
})
