import { describe, expect, it } from 'vitest'
import { getIndustryPalette, getIndustryPaletteOptions, paletteIds, palettes } from './industryPalettes'

const industries = ['美髮', '美容／美甲／美睫', '按摩／SPA', '健身／瑜伽／教練', '攝影／設計／個人工作室', '居家清潔／維修服務', '咖啡廳・甜點店', '其他服務業']

function luminance(hex: string): number {
  const rgb = hex.slice(1).match(/.{2}/gu)?.map((channel) => Number.parseInt(channel, 16) / 255) || []
  const linear = rgb.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(a: string, b: string): number {
  const [bright, dark] = [luminance(a), luminance(b)].sort((left, right) => right - left)
  return (bright + 0.05) / (dark + 0.05)
}

describe('industry palettes', () => {
  it('assigns a distinct named palette to every supported industry', () => {
    const palettes = industries.map((industry) => getIndustryPalette(industry))
    expect(new Set(palettes.map((palette) => palette.id))).toHaveLength(industries.length)
    expect(palettes.every((palette) => palette.name && palette.accent)).toBe(true)
  })

  it.each(industries)('keeps readable text contrast for %s', (industry) => {
    const palette = getIndustryPalette(industry)
    expect(contrast(palette.ink, palette.background)).toBeGreaterThanOrEqual(7)
    expect(contrast(palette.accent, palette.onAccent)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(paletteIds)('keeps every selectable %s palette readable', (id) => {
    const palette = palettes[id]
    expect(contrast(palette.ink, palette.background)).toBeGreaterThanOrEqual(7)
    expect(contrast(palette.accent, palette.onAccent)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(industries)('offers three distinct fallback recommendations for %s', (industry) => {
    const recommendations = getIndustryPaletteOptions(industry)
    expect(recommendations).toHaveLength(3)
    expect(new Set(recommendations)).toHaveLength(3)
  })
})
