import { describe, expect, it, vi } from 'vitest'
import { createPhotoToken, extractPlaceSource, handleRequest, mapPlaceToDraft, type Env } from './index'

const env: Env = {
  GOOGLE_MAPS_API_KEY: 'test-key',
  PHOTO_SIGNING_SECRET: 'test-signing-secret',
  ALLOWED_ORIGINS: 'https://jardinitsai168.github.io,http://localhost:4173',
}

describe('Google Maps source parsing', () => {
  it('extracts a place name and coordinates from a Google Maps place URL', () => {
    expect(extractPlaceSource('https://www.google.com/maps/place/%E6%97%A5%E5%85%89%E6%95%A3%E6%AD%A5%E7%8F%88%E7%90%B2/@25.041,121.543,17z')).toEqual({
      query: '日光散步珈琲',
      latitude: 25.041,
      longitude: 121.543,
    })
  })

  it('accepts an explicit place id from a Google Maps link', () => {
    expect(extractPlaceSource('https://www.google.com/maps/search/?api=1&query=cafe&query_place_id=ChIJ123')).toEqual({ placeId: 'ChIJ123' })
  })

  it('rejects non-Google URLs', () => {
    expect(() => extractPlaceSource('https://example.com/maps/place/store')).toThrow(/Google 地圖/)
  })
})

describe('Places mapping', () => {
  it('maps live place data without inventing services and keeps source attribution', async () => {
    const draft = await mapPlaceToDraft({
      id: 'place-1',
      displayName: { text: '日光散步珈琲' },
      primaryTypeDisplayName: { text: '咖啡店' },
      formattedAddress: '台北市大安區測試路 1 號',
      nationalPhoneNumber: '02 1234 5678',
      googleMapsUri: 'https://maps.google.com/?cid=1',
      regularOpeningHours: { weekdayDescriptions: ['星期一: 09:00–18:00'] },
      photos: [{
        name: 'places/place-1/photos/photo-1',
        googleMapsUri: 'https://maps.google.com/photo/1',
        authorAttributions: [{ displayName: '店家攝影師', uri: 'https://maps.google.com/user/1' }],
      }],
      reviews: [{
        name: 'places/place-1/reviews/review-1',
        rating: 5,
        originalText: { text: '空間舒服，咖啡很好喝。' },
        relativePublishTimeDescription: '2 週前',
        googleMapsUri: 'https://maps.google.com/review/1',
        authorAttribution: { displayName: '王小明', uri: 'https://maps.google.com/user/2' },
      }],
    }, 'https://maps.app.goo.gl/example', 'https://api.example.com', env)

    expect(draft.services).toEqual([])
    expect(draft.photos[0]).toMatchObject({
      source: 'google_places',
      sourceUrl: 'https://maps.google.com/photo/1',
      authorName: '店家攝影師',
    })
    expect(draft.photos[0].url).toMatch(/^https:\/\/api\.example\.com\/api\/photo\?token=/)
    expect(draft.reviews[0]).toMatchObject({
      text: '空間舒服，咖啡很好喝。',
      author: '王小明',
      sourceUrl: 'https://maps.google.com/review/1',
    })
    expect(draft.hours).toEqual([{ label: '星期一', value: '09:00–18:00' }])
  })
})

describe('Worker API', () => {
  it('imports a direct Google Maps URL through Text Search and Place Details', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('places:searchText')) {
        return Response.json({ places: [{ id: 'place-1', displayName: { text: '日光散步珈琲' } }] })
      }
      if (url.includes('/v1/places/place-1?')) {
        return Response.json({
          id: 'place-1',
          displayName: { text: '日光散步珈琲' },
          primaryTypeDisplayName: { text: '咖啡店' },
          formattedAddress: '台北市大安區測試路 1 號',
          googleMapsUri: 'https://maps.google.com/?cid=1',
          photos: [],
          reviews: [],
        })
      }
      return new Response('not found', { status: 404 })
    })
    const response = await handleRequest(new Request('https://api.example.com/api/import-place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://jardinitsai168.github.io' },
      body: JSON.stringify({ sourceUrl: 'https://www.google.com/maps/place/%E6%97%A5%E5%85%89%E6%95%A3%E6%AD%A5%E7%8F%88%E7%90%B2' }),
    }), env, fetcher as typeof fetch)

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://jardinitsai168.github.io')
    await expect(response.json()).resolves.toMatchObject({
      mode: 'live',
      draft: { googlePlaceId: 'place-1', name: '日光散步珈琲', source: 'google_places' },
    })
  })

  it('streams a signed photo without cache headers', async () => {
    const token = await createPhotoToken('places/place-1/photos/photo-1', env.PHOTO_SIGNING_SECRET)
    const fetcher = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } }))
    const response = await handleRequest(new Request(`https://api.example.com/api/photo?token=${encodeURIComponent(token)}`), env, fetcher as typeof fetch)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('content-type')).toBe('image/jpeg')
  })

  it('does not disclose Google errors or secrets', async () => {
    const fetcher = vi.fn(async () => new Response('upstream secret detail', { status: 403 }))
    const response = await handleRequest(new Request('https://api.example.com/api/import-place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: 'https://www.google.com/maps/place/test' }),
    }), env, fetcher as typeof fetch)
    const body = await response.text()
    expect(response.status).toBe(502)
    expect(body).not.toContain('upstream secret detail')
    expect(body).not.toContain(env.GOOGLE_MAPS_API_KEY)
  })
})
