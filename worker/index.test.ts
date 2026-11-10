import { describe, expect, it, vi } from 'vitest'
import { generateContent, handleRequest, prepareBrandCheckout, suggestDomains, SuggestionLimiter, type Env } from './index'

const env: Env = {
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_TEXT_MODEL: 'primary/model',
  OPENROUTER_FALLBACK_MODEL: 'fallback/model',
  PUBLIC_APP_URL: 'https://lihi.io/tools/site-builder/',
  ALLOWED_ORIGINS: 'https://jardinitsai168.github.io',
  EMDASH_SITE_URL: 'https://cms.example.com',
  EMDASH_API_TOKEN: 'emdash-test-key',
  EMDASH_COLLECTION: 'sites',
}
const brief = {
  industry: '美髮',
  brandName: '日光髮所',
  advantages: ['一對一諮詢', '重視髮質', '預約不久候'] as [string, string, string],
  offerings: ['剪髮', '染髮', '頭皮護理'] as [string, string, string],
  hours: '每日 10:00–18:00',
}
const content = {
  tagline: '讓每次整理都更像自己',
  description: '從需求溝通到完成造型，我們專注提供舒服而清楚的服務體驗。',
  advantages: brief.advantages,
  paletteKeys: ['hair', 'coral', 'midnight'] as const,
}
const site = {
  category: brief.industry,
  logoUrl: 'data:image/png;base64,YWJjMTIz',
  paletteKey: 'coral' as const,
  tagline: content.tagline,
  description: content.description,
  address: '台北市中山區',
  phone: '02 2345 6789',
  googleMapsUrl: 'https://maps.google.com/',
  lineUrl: 'https://line.me/',
  instagramUrl: 'https://instagram.com/',
  videoUrl: '',
  services: brief.advantages,
  offerings: brief.offerings,
  hours: [{ label: '每日', value: '10:00–18:00' }],
  photos: [
    {
      id: 'hero',
      role: 'hero',
      url: 'https://images.example.com/hero.jpg',
      alt: '店內空間',
      selected: true,
    },
  ],
}

describe('OpenRouter generation Worker', () => {
  it('requests strict structured content with one configured fallback', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body))
      expect(request.models).toEqual(['primary/model', 'fallback/model'])
      expect(request.route).toBe('fallback')
      expect(request.response_format.json_schema.strict).toBe(true)
      expect(request.reasoning).toEqual({ effort: 'none' })
      expect(request.max_tokens).toBe(1_200)
      expect(request).not.toHaveProperty('temperature')
      expect(request.messages[1].content).toContain('剪髮、染髮、頭皮護理')
      expect(request.messages[1].content).toContain('hair=暖棕沙龍')
      expect(request.messages[0].content).toContain('不得新增價格')
      expect(request.response_format.json_schema.schema.properties.paletteKeys.items.enum).toContain('midnight')
      return Response.json({
        choices: [{ message: { content: JSON.stringify(content) } }],
      })
    })
    await expect(generateContent(brief, env, fetcher as typeof fetch)).resolves.toEqual(content)
    expect(fetcher).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          'HTTP-Referer': 'https://lihi.io/tools/site-builder/',
          'X-OpenRouter-Title': 'Miaochuang Site',
        }),
      }),
    )
  })

  it('uses production-ready default and fallback models', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body))
      expect(request.model).toBe('openai/gpt-5.6-luna')
      expect(request.models).toEqual(['openai/gpt-5.6-luna', 'anthropic/claude-haiku-5.5'])
      return Response.json({
        choices: [{ message: { content: JSON.stringify(content) } }],
      })
    })
    await expect(
      generateContent(
        brief,
        {
          ...env,
          OPENROUTER_TEXT_MODEL: undefined,
          OPENROUTER_FALLBACK_MODEL: undefined,
        },
        fetcher as typeof fetch,
      ),
    ).resolves.toEqual(content)
  })

  it('returns exactly three safe domain suggestions', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                domains: ['sunnyhair.com', 'sunnyhair.tw', 'sunnyhairstudio.com'],
              }),
            },
          },
        ],
      }),
    )
    await expect(suggestDomains({ brandName: '日光髮所' }, env, fetcher as typeof fetch)).resolves.toEqual(['sunnyhair.com', 'sunnyhair.tw', 'sunnyhairstudio.com'])
  })

  it('limits each durable IP bucket to five recommendations', async () => {
    const values = new Map<string, unknown>()
    const state = {
      storage: {
        get: async (key: string) => values.get(key),
        put: async (key: string, value: unknown) => {
          values.set(key, value)
        },
      },
    } as unknown as DurableObjectState
    const limiter = new SuggestionLimiter(state)
    for (let index = 0; index < 5; index += 1) {
      await expect(limiter.fetch().then((response) => response.json())).resolves.toMatchObject({ allowed: true, remaining: 4 - index })
    }
    await expect(limiter.fetch().then((response) => response.json())).resolves.toEqual({ allowed: false, remaining: 0 })
  })

  it('requires at least one offering in addition to three advantages', async () => {
    const response = await handleRequest(
      new Request('https://api.example.com/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...brief, offerings: ['', '', ''] }),
      }),
      env,
      vi.fn() as typeof fetch,
    )
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_BRIEF' },
    })
  })

  it('keeps the health endpoint available before the AI secret is configured', async () => {
    const response = await handleRequest(new Request('https://api.example.com/health'), { ...env, OPENROUTER_API_KEY: '' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      provider: 'openrouter',
    })
  })

  it('does not disclose upstream errors or the API key', async () => {
    const fetcher = vi.fn(async () => new Response('sensitive upstream detail', { status: 500 }))
    const response = await handleRequest(
      new Request('https://api.example.com/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      }),
      env,
      fetcher as typeof fetch,
    )
    const body = await response.text()
    expect(response.status).toBe(502)
    expect(body).not.toContain('sensitive upstream detail')
    expect(body).not.toContain(env.OPENROUTER_API_KEY)
  })

  it('creates an unpublished brand handoff before domain checkout', async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = []
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: String(input),
        method: String(init?.method),
        body: JSON.parse(String(init?.body)),
      })
      return Response.json(
        {
          success: true,
          data: { item: { id: 'entry-1', slug: 'brand-test' } },
        },
        { status: 201 },
      )
    })
    const result = await prepareBrandCheckout(
      {
        name: '日光髮所',
        template: 'marketing',
        expiresAt: Date.now() + 1000,
        site,
        html: '<!doctype html><title>日光髮所</title>',
        launchMode: 'brand',
      },
      env,
      fetcher as typeof fetch,
    )
    expect(result).toMatchObject({
      handoffId: 'entry-1',
      checkoutUrl: expect.stringContaining('https://lihi.io/go/search?'),
      previewUrl: expect.stringContaining('/s/brand-'),
    })
    const checkout = new URL(result.checkoutUrl)
    expect(checkout.searchParams.get('s')).toBe('日光髮所')
    expect(checkout.searchParams.get('source')).toBe('miaochuang:entry-1')
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      url: 'https://cms.example.com/_emdash/api/content/sites',
      method: 'POST',
    })
    expect(calls[0].body).toMatchObject({
      status: 'draft',
      data: {
        name: '日光髮所',
        template: 'editorial',
        template_key: 'marketing',
        palette_key: 'coral',
        logo_url: site.logoUrl,
        tagline: site.tagline,
        photo_1_url: site.photos[0].url,
      },
    })
  })

  it('forwards the selected suggestion to lihi domain search', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        success: true,
        data: { item: { id: 'entry-domain', slug: 'brand-domain' } },
      }),
    )
    const result = await prepareBrandCheckout(
      {
        name: '日光髮所',
        domainQuery: 'sunnyhair.com',
        template: 'marketing',
        expiresAt: Date.now() + 1000,
        site,
        html: '<!doctype html>',
        launchMode: 'brand',
      },
      env,
      fetcher as typeof fetch,
    )
    expect(new URL(result.checkoutUrl).searchParams.get('s')).toBe('sunnyhair.com')
  })

  it('updates the same unpublished handoff when brand checkout is retried', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) =>
      Response.json({
        success: true,
        data: { item: { id: 'entry-7', slug: 'site-existing' } },
      }),
    )
    const result = await prepareBrandCheckout(
      {
        name: '日光髮所',
        template: 'starter',
        expiresAt: Date.now() + 1000,
        site,
        html: '<!doctype html><title>更新</title>',
        launchMode: 'brand',
        handoff: { handoffId: 'entry-7', slug: 'site-existing' },
      },
      env,
      fetcher as typeof fetch,
    )
    expect(result).toMatchObject({
      handoffId: 'entry-7',
      slug: 'site-existing',
    })
    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://cms.example.com/_emdash/api/content/sites/entry-7', expect.objectContaining({ method: 'PUT' }))
  })

  it('publishes a noindex public preview with a thirty-day expiry', async () => {
    const calls: Array<{ url: string; body: unknown }> = []
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)),
      })
      return Response.json(
        {
          success: true,
          data: { item: { id: 'entry-public', slug: 'brand-public' } },
        },
        { status: 201 },
      )
    })
    const result = await prepareBrandCheckout(
      {
        name: '日光髮所',
        template: 'blog',
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        site,
        html: '<!doctype html><meta name="robots" content="noindex,nofollow"><title>日光髮所</title>',
        launchMode: 'public',
      },
      env,
      fetcher as typeof fetch,
    )
    expect(result.previewUrl).toMatch(/\/s\/brand-/u)
    expect(calls[0].body).toMatchObject({
      status: 'draft',
      data: { expires_at: expect.any(String) },
    })
    expect(calls[1]).toMatchObject({
      url: 'https://cms.example.com/_emdash/api/content/sites/entry-public/publish',
      body: {},
    })
  })

  it('does not expose the old direct deployment API', async () => {
    const response = await handleRequest(
      new Request('https://api.example.com/api/deploy-emdash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
      env,
      vi.fn() as typeof fetch,
    )
    expect(response.status).toBe(404)
  })
})
