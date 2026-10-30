import { describe, expect, it, vi } from 'vitest'
import { generateContent, generateImage, handleRequest, type Env } from './index'

const env: Env = { OPENAI_API_KEY: 'test-key', ALLOWED_ORIGINS: 'https://jardinitsai168.github.io' }
const brief = { industry: '咖啡廳', brandName: '日光散步', advantages: ['自家烘焙', '每日手作', '安靜空間'] as [string, string, string], hours: '每日 10:00–18:00' }
const content = { tagline: '留一段舒服的日常', description: '介紹文案', services: brief.advantages, photoPrompts: Array.from({ length: 8 }, (_, i) => `prompt ${i}`), photoAlts: Array.from({ length: 8 }, (_, i) => `照片 ${i}`) }

describe('AI generation Worker', () => {
  it('requests structured brand content without inventing input fields', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body))
      expect(request.text.format.type).toBe('json_schema')
      expect(request.input[1].content).toContain('自家烘焙')
      return Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(content) }] }] })
    })
    await expect(generateContent(brief, env, fetcher as typeof fetch)).resolves.toEqual(content)
  })

  it('generates a compressed landscape image with a privacy-safe identifier', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body))
      expect(request).toMatchObject({ size: '1536x1024', quality: 'low', output_format: 'jpeg' })
      expect(request.safety_identifier).toMatch(/^brand-[0-9a-f]+$/)
      return Response.json({ data: [{ b64_json: 'abc123' }], output_format: 'jpeg' })
    })
    await expect(generateImage({ prompt: 'photo prompt', brandName: '日光散步', industry: '咖啡廳' }, env, fetcher as typeof fetch)).resolves.toBe('data:image/jpeg;base64,abc123')
  })

  it('validates all three advantages', async () => {
    const response = await handleRequest(new Request('https://api.example.com/api/generate-content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...brief, advantages: ['一', '二', ''] }),
    }), env, vi.fn() as typeof fetch)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_BRIEF' } })
  })

  it('does not disclose upstream errors or the API key', async () => {
    const fetcher = vi.fn(async () => new Response('sensitive upstream detail', { status: 500 }))
    const response = await handleRequest(new Request('https://api.example.com/api/generate-content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brief),
    }), env, fetcher as typeof fetch)
    const body = await response.text()
    expect(response.status).toBe(502)
    expect(body).not.toContain('sensitive upstream detail')
    expect(body).not.toContain(env.OPENAI_API_KEY)
  })
})
