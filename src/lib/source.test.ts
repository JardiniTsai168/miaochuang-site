import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDemoBusiness } from '../data/demoBusiness'
import { importBusiness, isGoogleBusinessUrl } from './source'

afterEach(() => vi.restoreAllMocks())

describe('isGoogleBusinessUrl', () => {
  it('accepts supported Google Maps URLs', () => {
    expect(isGoogleBusinessUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    expect(isGoogleBusinessUrl('https://www.google.com/maps/place/Test')).toBe(true)
    expect(isGoogleBusinessUrl('https://maps.google.com/?q=coffee')).toBe(true)
  })

  it('rejects invalid and non-Google URLs', () => {
    expect(isGoogleBusinessUrl('not-a-url')).toBe(false)
    expect(isGoogleBusinessUrl('http://maps.app.goo.gl/abc123')).toBe(false)
    expect(isGoogleBusinessUrl('https://example.com/maps/place/Test')).toBe(false)
  })
})

describe('importBusiness', () => {
  it('keeps the bundled demo local without calling the API', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
    const demo = createDemoBusiness()
    await expect(importBusiness(demo.sourceUrl)).resolves.toMatchObject({ mode: 'demo', draft: { source: 'demo' } })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns a live Places draft from the import API', async () => {
    const liveDraft = { ...createDemoBusiness(), source: 'google_places' as const, googlePlaceId: 'place-1' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ mode: 'live', draft: liveDraft }))
    await expect(importBusiness('https://www.google.com/maps/place/Live+Store')).resolves.toMatchObject({
      mode: 'live',
      draft: { source: 'google_places', googlePlaceId: 'place-1' },
    })
  })

  it('shows the sanitized API error instead of silently using demo data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      error: { code: 'PLACE_NOT_FOUND', message: '找不到這間 Google 商家，請確認網址後再試。' },
    }, { status: 404 }))
    await expect(importBusiness('https://www.google.com/maps/place/Missing+Store')).rejects.toMatchObject({
      code: 'PLACE_NOT_FOUND',
      message: '找不到這間 Google 商家，請確認網址後再試。',
    })
  })
})
