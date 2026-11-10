import { describe, expect, it } from 'vitest'
import { createDemoBusiness } from '../data/demoBusiness'
import { renderSite } from './renderSite'

describe('renderSite', () => {
  it('renders a complete static site with SEO and selected content', () => {
    const draft = createDemoBusiness()
    const html = renderSite(draft)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<script type="application/ld+json">')
    expect(html).toContain(draft.name)
    expect(html).toContain('品牌影像')
    expect(html).not.toContain('拿鐵與咖啡豆')
  })

  it('escapes user-controlled HTML', () => {
    const draft = { ...createDemoBusiness(), name: '<img src=x onerror=alert(1)>' }
    const html = renderSite(draft)
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it.each(['editorial', 'vivid', 'calm', 'compact', 'mosaic'] as const)('renders the %s template', (template) => {
    const html = renderSite({ ...createDemoBusiness(), template })
    expect(html).toContain('--accent:')
    expect(html).toContain('Powered by lihi.io')
    expect(html).toContain('class="industry-art"')
    expect(html).toContain('class="hero-index"')
    expect(html).toContain(`data-layout="${template}"`)
  })

  it('uses different content structures instead of only changing photos or colors', () => {
    const draft = createDemoBusiness()
    const editorial = renderSite({ ...draft, template: 'editorial' })
    const vivid = renderSite({ ...draft, template: 'vivid' })
    const compact = renderSite({ ...draft, template: 'compact' })
    const mosaic = renderSite({ ...draft, template: 'mosaic' })

    expect(editorial.indexOf('id="about"')).toBeLessThan(editorial.indexOf('id="gallery"'))
    expect(vivid.indexOf('id="services"')).toBeLessThan(vivid.indexOf('id="about"'))
    expect(compact.indexOf('id="contact"')).toBeLessThan(compact.indexOf('id="services"'))
    expect(mosaic.indexOf('id="gallery"')).toBeLessThan(mosaic.indexOf('id="services"'))
  })

  it('adds an industry-specific marker from the business category', () => {
    const html = renderSite(createDemoBusiness())
    expect(html).toContain('data-industry="cafe"')
    expect(html).toContain('COFFEE &amp; DESSERT')
  })

  it.each(['editorial', 'vivid', 'calm', 'compact', 'mosaic'] as const)('caps the %s template title at the approved size', (template) => {
    const html = renderSite({ ...createDemoBusiness(), template })
    expect(html).toContain('font-size:clamp(40px,4.4vw,48px)')
    expect(html).toContain('<h1>日光散步珈琲</h1>')
  })

  it('does not expose image attribution or internal image labels', () => {
    const draft = createDemoBusiness()
    draft.photos[0].sourceUrl = 'https://example.com/photo'
    const html = renderSite(draft)
    expect(html).not.toContain('查看來源')
    expect(html).not.toContain('主視覺來源')
    expect(html).not.toContain('<figcaption>')
    expect(html).not.toContain('example.com/photo')
  })

  it('opens external preview links outside the iframe without breaking internal anchors', () => {
    const html = renderSite(createDemoBusiness())
    expect(html).toContain('<base target="_blank">')
    expect(html).toContain('href="#about" target="_self"')
    expect(html).toContain('target="_blank" rel="noopener noreferrer">查看地圖</a>')
  })

  it('keeps same-origin campaign assets instead of replacing them with broken fallbacks', () => {
    const draft = createDemoBusiness()
    const html = renderSite(draft)
    expect(html).toContain(`src="${draft.photos[0].url}"`)
    expect(html).not.toContain('<img src="#"')
  })

  it('accepts generated image data URLs while blocking other data payloads', () => {
    const draft = createDemoBusiness()
    draft.photos[0].url = 'data:image/jpeg;base64,YWJjMTIz'
    draft.photos[1].url = 'data:text/html;base64,PHNjcmlwdD4='
    const html = renderSite(draft)
    expect(html).toContain('src="data:image/jpeg;base64,YWJjMTIz"')
    expect(html).not.toContain('data:text/html')
  })

})
