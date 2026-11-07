import { describe, expect, it, vi } from 'vitest'
import { deployToEmDash, generateContent, handleRequest, type Env } from './index'

const env: Env = {
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_TEXT_MODEL: 'primary/model',
  OPENROUTER_FALLBACK_MODEL: 'fallback/model',
  PUBLIC_APP_URL: 'https://lihi.io/tools/site-builder/',
  ALLOWED_ORIGINS: 'https://jardinitsai168.github.io',
  EMDASH_SITE_URL: 'https://cms.example.com',
  EMDASH_PUBLIC_URL: 'https://sites.example.com',
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
const content = { tagline: '讓每次整理都更像自己', description: '從需求溝通到完成造型，我們專注提供舒服而清楚的服務體驗。', advantages: brief.advantages }

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
      expect(request.messages[0].content).toContain('不得新增價格')
      return Response.json({ choices: [{ message: { content: JSON.stringify(content) } }] })
    })
    await expect(generateContent(brief, env, fetcher as typeof fetch)).resolves.toEqual(content)
    expect(fetcher).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', expect.objectContaining({
      headers: expect.objectContaining({ 'HTTP-Referer': 'https://lihi.io/tools/site-builder/', 'X-OpenRouter-Title': 'Miaochuang Site' }),
    }))
  })

  it('uses production-ready default and fallback models', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body))
      expect(request.model).toBe('openai/gpt-5.6-luna')
      expect(request.models).toEqual(['openai/gpt-5.6-luna', 'anthropic/claude-haiku-5.5'])
      return Response.json({ choices: [{ message: { content: JSON.stringify(content) } }] })
    })
    await expect(generateContent(brief, {
      ...env,
      OPENROUTER_TEXT_MODEL: undefined,
      OPENROUTER_FALLBACK_MODEL: undefined,
    }, fetcher as typeof fetch)).resolves.toEqual(content)
  })

  it('requires at least one offering in addition to three advantages', async () => {
    const response = await handleRequest(new Request('https://api.example.com/api/generate-content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...brief, offerings: ['', '', ''] }),
    }), env, vi.fn() as typeof fetch)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_BRIEF' } })
  })

  it('keeps the health endpoint available before the AI secret is configured', async () => {
    const response = await handleRequest(new Request('https://api.example.com/health'), { ...env, OPENROUTER_API_KEY: '' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, provider: 'openrouter' })
  })

  it('does not disclose upstream errors or the API key', async () => {
    const fetcher = vi.fn(async () => new Response('sensitive upstream detail', { status: 500 }))
    const response = await handleRequest(new Request('https://api.example.com/api/generate-content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brief),
    }), env, fetcher as typeof fetch)
    const body = await response.text()
    expect(response.status).toBe(502)
    expect(body).not.toContain('sensitive upstream detail')
    expect(body).not.toContain(env.OPENROUTER_API_KEY)
  })

  it('creates and publishes a new EmDash site entry', async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = []
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), method: String(init?.method), body: JSON.parse(String(init?.body)) })
      if (String(input).endsWith('/publish')) return Response.json({ success: true, data: { item: { id: 'entry-1', slug: 'site-test' } } })
      return Response.json({ success: true, data: { item: { id: 'entry-1', slug: 'site-test' } } }, { status: 201 })
    })
    const result = await deployToEmDash({ name: '日光髮所', template: 'editorial', expiresAt: Date.now() + 1000, html: '<!doctype html><title>日光髮所</title>' }, env, fetcher as typeof fetch)
    expect(result).toMatchObject({ entryId: 'entry-1', url: expect.stringMatching(/^https:\/\/sites\.example\.com\/s\/site-/u) })
    expect(calls).toHaveLength(2)
    expect(calls[0]).toMatchObject({ url: 'https://cms.example.com/_emdash/api/content/sites', method: 'POST' })
    expect(calls[1]).toMatchObject({ url: 'https://cms.example.com/_emdash/api/content/sites/entry-1/publish', method: 'POST' })
  })

  it('updates and republishes the same EmDash entry', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => Response.json({ success: true, data: { item: { id: 'entry-7', slug: 'site-existing' } } }))
    const result = await deployToEmDash({
      name: '日光髮所', template: 'calm', expiresAt: Date.now() + 1000, html: '<!doctype html><title>更新</title>',
      deployment: { entryId: 'entry-7', slug: 'site-existing' },
    }, env, fetcher as typeof fetch)
    expect(result).toMatchObject({ entryId: 'entry-7', slug: 'site-existing', url: 'https://sites.example.com/s/site-existing' })
    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://cms.example.com/_emdash/api/content/sites/entry-7', expect.objectContaining({ method: 'PUT' }))
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://cms.example.com/_emdash/api/content/sites/entry-7/publish', expect.objectContaining({ method: 'POST' }))
  })
})
