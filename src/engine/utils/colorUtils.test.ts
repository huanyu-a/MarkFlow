import { describe, it, expect } from 'vitest'
import {
  NAMED_COLORS,
  resolveColor,
  colorToAlpha,
  darkenColor,
} from './colorUtils'

describe('NAMED_COLORS', () => {
  it('maps common color names to hex values', () => {
    expect(NAMED_COLORS.red).toBe('#e74c3c')
    expect(NAMED_COLORS.blue).toBe('#3498db')
    expect(NAMED_COLORS.green).toBe('#27ae60')
    expect(NAMED_COLORS.black).toBe('#222222')
    expect(NAMED_COLORS.white).toBe('#ffffff')
  })

  it('contains extended color names', () => {
    expect(NAMED_COLORS.crimson).toBe('#dc143c')
    expect(NAMED_COLORS.coral).toBe('#ff6f61')
    expect(NAMED_COLORS.gold).toBe('#ffd700')
    expect(NAMED_COLORS.lavender).toBe('#e6e6fa')
  })
})

describe('resolveColor', () => {
  it('returns hex values as-is', () => {
    expect(resolveColor('#e74c3c')).toBe('#e74c3c')
    expect(resolveColor('#000000')).toBe('#000000')
    expect(resolveColor('#ffffff')).toBe('#ffffff')
  })

  it('converts rgb() to hex', () => {
    expect(resolveColor('rgb(231,76,60)')).toBe('#e74c3c')
    expect(resolveColor('rgb(0,0,0)')).toBe('#000000')
    expect(resolveColor('rgb(255,255,255)')).toBe('#ffffff')
  })

  it('converts rgba() to hex', () => {
    expect(resolveColor('rgba(231,76,60,0.5)')).toBe('#e74c3c')
  })

  it('converts named colors to hex (case insensitive)', () => {
    expect(resolveColor('red')).toBe('#e74c3c')
    expect(resolveColor('Red')).toBe('#e74c3c')
    expect(resolveColor('BLUE')).toBe('#3498db')
  })

  it('returns unknown color names as-is', () => {
    expect(resolveColor('notacolor')).toBe('notacolor')
  })

  it('handles empty string', () => {
    expect(resolveColor('')).toBe('')
  })
})

describe('colorToAlpha', () => {
  it('converts hex to rgba with default opacity', () => {
    const result = colorToAlpha('#e74c3c')
    expect(result).toBe('rgba(231,76,60,0.12)')
  })

  it('converts hex to rgba with custom opacity', () => {
    const result = colorToAlpha('#000000', 0.5)
    expect(result).toBe('rgba(0,0,0,0.5)')
  })

  it('handles pure black #000000', () => {
    expect(colorToAlpha('#000000')).toBe('rgba(0,0,0,0.12)')
  })

  it('handles pure white #ffffff', () => {
    expect(colorToAlpha('#ffffff')).toBe('rgba(255,255,255,0.12)')
  })

  it('resolves named colors before conversion', () => {
    const result = colorToAlpha('red', 0.2)
    expect(result).toBe('rgba(231,76,60,0.2)')
  })

  it('returns fallback for unresolvable colors', () => {
    const result = colorToAlpha('invalid', 0.3)
    expect(result).toBe('rgba(0,0,0,0.3)')
  })
})

describe('darkenColor', () => {
  it('darkens a hex color by default amount', () => {
    const result = darkenColor('#e74c3c')
    // r=231*(1-0.15)=196.35≈196 → c4
    // g=76*(1-0.15)=64.6≈65 → 41
    // b=60*(1-0.15)=51 → 33
    expect(result).toBe('#c44133')
  })

  it('darkens a hex color by custom amount', () => {
    const result = darkenColor('#ffffff', 0.5)
    // 255 * 0.5 = 127.5 ≈ 128 → 80
    expect(result).toBe('#808080')
  })

  it('handles pure black (stays black)', () => {
    const result = darkenColor('#000000')
    expect(result).toBe('#000000')
  })

  it('handles pure white', () => {
    const result = darkenColor('#ffffff', 0.1)
    // 255 * 0.9 = 229.5 ≈ 230 → e6
    expect(result).toBe('#e6e6e6')
  })

  it('does not go below 0 (clamped)', () => {
    const result = darkenColor('#111111', 0.99)
    // All channels near 0
    expect(result).toBe('#000000')
  })

  it('resolves named colors before darkening', () => {
    const result = darkenColor('red', 0.2)
    const directResult = darkenColor('#e74c3c', 0.2)
    expect(result).toBe(directResult)
  })

  it('returns unresolvable colors as-is', () => {
    const result = darkenColor('notacolor')
    expect(result).toBe('notacolor')
  })
})
