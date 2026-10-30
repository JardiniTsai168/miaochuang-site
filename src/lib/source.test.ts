import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateBusiness, validateBrief } from './source'

afterEach(() => vi.restoreAllMocks())

const brief = { industry: '咖啡廳', brandName: '日光散步', advantages: ['自家烘焙', '每日手作', '安靜空間'] as [string, string, string], hours: '每日 10:00–18:00' }

describe('brand brief generation', () => {
  it('requires industry, name and exactly three filled advantages', () => {
    expect(validateBrief(brief)).toBe('')
    expect(validateBrief({ ...brief, advantages: ['一', '', '三'] })).toMatch(/三個優點/)
  })

  it('generates eight candidate images and preselects five', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).endsWith('/api/generate-content')) return Response.json({
        tagline: '把午後留給一杯好咖啡', description: '品牌介紹', services: brief.advantages,
        photoPrompts: Array.from({ length: 8 }, (_, i) => `prompt ${i}`),
        photoAlts: Array.from({ length: 8 }, (_, i) => `品牌影像 ${i + 1}`),
      })
      return Response.json({ dataUrl: 'data:image/jpeg;base64,abc123' })
    })
    const result = await generateBusiness(brief)
    expect(result.mode).toBe('generated')
    expect(result.draft).toMatchObject({ source: 'ai_generated', name: '日光散步', category: '咖啡廳', reviews: [] })
    expect(result.draft.photos).toHaveLength(8)
    expect(result.draft.photos.filter((photo) => photo.selected)).toHaveLength(5)
    expect(fetcher).toHaveBeenCalledTimes(9)
  })
})
