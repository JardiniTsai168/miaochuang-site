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
    expect(html).toContain('Google 評論')
    expect(html).not.toContain('拿鐵與咖啡豆')
  })

  it('escapes user-controlled HTML', () => {
    const draft = { ...createDemoBusiness(), name: '<img src=x onerror=alert(1)>' }
    const html = renderSite(draft)
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it.each(['editorial', 'vivid', 'calm'] as const)('renders the %s template', (template) => {
    const html = renderSite({ ...createDemoBusiness(), template })
    expect(html).toContain('--accent:')
    expect(html).toContain('Powered by lihiDomain')
  })

  it('opens external preview links outside the iframe without breaking internal anchors', () => {
    const html = renderSite(createDemoBusiness())
    expect(html).toContain('<base target="_blank">')
    expect(html).toContain('href="#about" target="_self"')
    expect(html).toContain('target="_blank" rel="noopener noreferrer">查看地圖</a>')
  })
})
