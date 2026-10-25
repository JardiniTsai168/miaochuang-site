import { describe, expect, it } from 'vitest'
import { isGoogleBusinessUrl } from './source'

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
