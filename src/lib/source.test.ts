import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateBusiness, validateBrief } from './source'

afterEach(() => vi.restoreAllMocks())

const brief = {
  industry: '美髮',
  brandName: '日光髮所',
  advantages: ['一對一諮詢', '重視髮質', '預約不久候'] as [string, string, string],
  offerings: ['剪髮', '染髮', '頭皮護理'] as [string, string, string],
  hours: '每日 10:00–18:00',
}

describe('brand brief generation', () => {
  it('requires industry, name, three advantages and one offering', () => {
    expect(validateBrief(brief)).toBe('')
    expect(validateBrief({ ...brief, advantages: ['一', '', '三'] })).toMatch(/三個優點/)
    expect(validateBrief({ ...brief, offerings: ['', '', ''] })).toMatch(/主要服務/)
  })

  it('generates copy once and pairs it with five reusable library images', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      tagline: '讓每次整理都更像自己', description: '品牌介紹', advantages: brief.advantages,
    }))
    const result = await generateBusiness(brief)
    expect(result.mode).toBe('generated')
    expect(result.draft).toMatchObject({ source: 'generated', name: '日光髮所', category: '美髮', offerings: brief.offerings, reviews: [] })
    expect(result.draft.photos).toHaveLength(5)
    expect(result.draft.photos.filter((photo) => photo.selected)).toHaveLength(5)
    expect(result.draft.expiresAt - result.draft.createdAt).toBe(7 * 24 * 60 * 60 * 1000)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('pairs photos to the submitted industry and service instead of the generic demo pool', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({
      tagline: '讓每次整理都更像自己', description: '品牌介紹', advantages: brief.advantages,
    }))

    const salon = await generateBusiness(brief)
    const cleaning = await generateBusiness({
      ...brief,
      industry: '居家清潔／維修服務',
      brandName: '日日潔淨',
      offerings: ['居家清潔', '冷氣清洗', '入住清潔'],
    })

    expect(salon.draft.photos.every((photo) => photo.source === 'stock')).toBe(true)
    expect(salon.draft.photos.every((photo) => photo.sourceUrl?.includes('unsplash.com'))).toBe(true)
    expect(salon.draft.photos[0].alt).toContain('美髮')
    expect(salon.draft.photos.some((photo) => photo.alt.includes('剪髮'))).toBe(true)
    expect(salon.draft.photos.map((photo) => photo.url)).not.toEqual(cleaning.draft.photos.map((photo) => photo.url))
  })
})
