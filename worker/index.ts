import { paletteIds, palettes, type PaletteId } from '../src/data/industryPalettes'

export type Env = {
  OPENROUTER_API_KEY: string
  OPENROUTER_TEXT_MODEL?: string
  OPENROUTER_FALLBACK_MODEL?: string
  PUBLIC_APP_URL?: string
  ALLOWED_ORIGINS?: string
  EMDASH_SITE_URL?: string
  EMDASH_API_TOKEN?: string
  EMDASH_COLLECTION?: string
  LIHI_DOMAIN_SEARCH_URL?: string
  DOMAIN_SUGGESTION_LIMIT_ENABLED?: string
  EMDASH_SERVICE?: {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  }
  SUGGESTION_LIMITER?: DurableObjectNamespace
}

type Fetcher = typeof fetch

type BrandBrief = {
  industry: string
  brandName: string
  advantages: [string, string, string]
  offerings: [string, string, string]
  hours?: string
}

type GeneratedContent = {
  tagline: string
  description: string
  advantages: [string, string, string]
  paletteKeys: [PaletteId, PaletteId, PaletteId]
}

type SiteContent = {
  category: string
  logoUrl?: string
  paletteKey?: PaletteId
  tagline: string
  description: string
  address: string
  phone: string
  googleMapsUrl: string
  lineUrl: string
  instagramUrl: string
  videoUrl: string
  services: string[]
  offerings: string[]
  hours: Array<{ label: string; value: string }>
  photos: Array<{
    id: string
    role: string
    url: string
    alt: string
    selected: boolean
  }>
}

type BrandCheckoutInput = {
  name: string
  template: string
  expiresAt: number
  site: SiteContent
  html: string
  launchMode: 'public' | 'brand'
  domainQuery?: string
  handoff?: { handoffId: string; slug: string }
}

type DomainSuggestionInput = { brandName: string }

type EmDashItem = { id: string; slug: string | null }

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

function clean(value: unknown, max = 160): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function parseBrief(value: unknown): BrandBrief {
  const body = (value || {}) as Record<string, unknown>
  const rawAdvantages = Array.isArray(body.advantages) ? body.advantages : []
  const rawOfferings = Array.isArray(body.offerings) ? body.offerings : []
  const brief: BrandBrief = {
    industry: clean(body.industry, 80),
    brandName: clean(body.brandName, 80),
    advantages: [clean(rawAdvantages[0]), clean(rawAdvantages[1]), clean(rawAdvantages[2])],
    offerings: [clean(rawOfferings[0]), clean(rawOfferings[1]), clean(rawOfferings[2])],
    hours: clean(body.hours, 500),
  }
  if (!brief.industry || !brief.brandName || brief.advantages.some((item) => !item) || !brief.offerings[0]) {
    throw new ApiError(400, 'INVALID_BRIEF', '請完整填寫產業、品牌名稱、三個優勢與至少一項主要服務。')
  }
  return brief
}

function allowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return allowed.length === 0 || allowed.includes(origin)
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('origin') || ''
  return {
    'Access-Control-Allow-Origin': allowedOrigin(request, env) && origin ? origin : 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    Vary: 'Origin',
  }
}

function json(request: Request, env: Env, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders(request, env) })
}

const contentSchema = {
  type: 'object',
  properties: {
    tagline: { type: 'string', description: '20 個繁體中文字以內的網站主標題' },
    description: {
      type: 'string',
      description: '80 到 140 個繁體中文字的品牌介紹',
    },
    advantages: {
      type: 'array',
      description: '依使用者三個優勢分別改寫的短標題，不得新增事實',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
    paletteKeys: {
      type: 'array',
      description: '依品牌產業、名稱與定位挑選的三組品牌色票 ID，依適合程度排序且不可重複',
      items: { type: 'string', enum: paletteIds },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ['tagline', 'description', 'advantages', 'paletteKeys'],
  additionalProperties: false,
}

function parseGenerated(value: unknown): GeneratedContent {
  const content = (value || {}) as Record<string, unknown>
  const advantages = Array.isArray(content.advantages) ? content.advantages.map((item) => clean(item, 80)) : []
  const paletteKeys = Array.isArray(content.paletteKeys)
    ? content.paletteKeys.map((item) => clean(item, 40)).filter((item): item is PaletteId => paletteIds.includes(item as PaletteId))
    : []
  const generated: GeneratedContent = {
    tagline: clean(content.tagline, 80),
    description: clean(content.description, 600),
    advantages: [advantages[0] || '', advantages[1] || '', advantages[2] || ''],
    paletteKeys: paletteKeys.slice(0, 3) as GeneratedContent['paletteKeys'],
  }
  if (!generated.tagline || !generated.description || generated.advantages.some((item) => !item) || generated.paletteKeys.some((item) => !item) || new Set(generated.paletteKeys).size !== 3) {
    throw new ApiError(502, 'INVALID_AI_RESPONSE', 'AI 沒有回傳完整網站文案，請再試一次。')
  }
  return generated
}

function parseBrandCheckoutInput(value: unknown): BrandCheckoutInput {
  const body = (value || {}) as Record<string, unknown>
  const rawSite = body.site && typeof body.site === 'object' ? (body.site as Record<string, unknown>) : {}
  const services = Array.isArray(rawSite.services)
    ? rawSite.services
        .map((item) => clean(item, 160))
        .filter(Boolean)
        .slice(0, 3)
    : []
  const offerings = Array.isArray(rawSite.offerings)
    ? rawSite.offerings
        .map((item) => clean(item, 160))
        .filter(Boolean)
        .slice(0, 3)
    : []
  const hours = Array.isArray(rawSite.hours)
    ? rawSite.hours
        .slice(0, 7)
        .map((item) => {
          const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
          return { label: clean(row.label, 80), value: clean(row.value, 120) }
        })
        .filter((item) => item.label || item.value)
    : []
  const photos = Array.isArray(rawSite.photos)
    ? rawSite.photos
        .slice(0, 5)
        .map((item, index) => {
          const photo = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
          const url = typeof photo.url === 'string' ? photo.url.trim().slice(0, 1_500_000) : ''
          return {
            id: clean(photo.id, 120) || `photo-${index + 1}`,
            role: clean(photo.role, 40),
            url,
            alt: clean(photo.alt, 300),
            selected: photo.selected !== false,
          }
        })
        .filter((item) => item.url)
    : []
  const rawHandoff = body.handoff && typeof body.handoff === 'object' ? (body.handoff as Record<string, unknown>) : undefined
  const handoff = rawHandoff
    ? {
        handoffId: clean(rawHandoff.handoffId, 120),
        slug: clean(rawHandoff.slug, 120),
      }
    : undefined
  const input: BrandCheckoutInput = {
    name: clean(body.name, 80),
    template: clean(body.template, 40),
    expiresAt: typeof body.expiresAt === 'number' ? body.expiresAt : 0,
    site: {
      category: clean(rawSite.category, 120),
      logoUrl: typeof rawSite.logoUrl === 'string' ? rawSite.logoUrl.trim().slice(0, 1_500_000) : '',
      paletteKey: paletteIds.includes(clean(rawSite.paletteKey, 40) as PaletteId) ? clean(rawSite.paletteKey, 40) as PaletteId : undefined,
      tagline: clean(rawSite.tagline, 160),
      description: clean(rawSite.description, 1200),
      address: clean(rawSite.address, 300),
      phone: clean(rawSite.phone, 80),
      googleMapsUrl: clean(rawSite.googleMapsUrl, 600),
      lineUrl: clean(rawSite.lineUrl, 600),
      instagramUrl: clean(rawSite.instagramUrl, 600),
      videoUrl: clean(rawSite.videoUrl, 600),
      services,
      offerings,
      hours,
      photos,
    },
    html: typeof body.html === 'string' ? body.html : '',
    launchMode: body.launchMode === 'public' ? 'public' : 'brand',
    domainQuery: clean(body.domainQuery, 120),
    ...(handoff?.handoffId && /^[a-z0-9-]+$/iu.test(handoff.slug) ? { handoff } : {}),
  }
  if (!input.name || !['marketing', 'portfolio', 'blog', 'starter'].includes(input.template) || !input.expiresAt || !input.html || input.html.length > 2_000_000 || !input.site.category || !input.site.tagline || !input.site.description || input.site.offerings.length === 0) {
    throw new ApiError(400, 'INVALID_BRAND_CHECKOUT', '品牌資料不完整或版型不正確。')
  }
  return input
}

function parseDomainSuggestionInput(value: unknown): DomainSuggestionInput {
  const body = (value || {}) as Record<string, unknown>
  const input = { brandName: clean(body.brandName, 80) }
  if (!input.brandName) throw new ApiError(400, 'INVALID_BRAND_NAME', '請輸入品牌名稱。')
  return input
}

async function consumeSuggestionQuota(request: Request, env: Env): Promise<number> {
  if (!env.SUGGESTION_LIMITER) throw new ApiError(503, 'RATE_LIMIT_NOT_CONFIGURED', '網域推薦服務尚未完成設定。')
  const ip = request.headers.get('CF-Connecting-IP') || 'local-development'
  // v2 intentionally starts a fresh bucket after the temporary unlimited test period.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`miaochuang-domain:v2:${ip}`))
  const key = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  const response = await env.SUGGESTION_LIMITER.get(env.SUGGESTION_LIMITER.idFromName(key)).fetch('https://limiter.internal/consume', { method: 'POST' })
  const result = (await response.json()) as {
    allowed: boolean
    remaining: number
  }
  if (!result.allowed) throw new ApiError(429, 'SUGGESTION_LIMIT_REACHED', '這個網路已使用 5 次重新推薦，請直接搜尋喜歡的網域名稱。')
  return result.remaining
}

function emdashBaseUrl(value: string | undefined, variable: string): string {
  if (!value) throw new ApiError(503, 'EMDASH_NOT_CONFIGURED', `EmDash 尚未設定 ${variable}。`)
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('unsafe protocol')
    return url.toString().replace(/\/$/u, '')
  } catch {
    throw new ApiError(503, 'EMDASH_NOT_CONFIGURED', `EmDash 的 ${variable} 設定不正確。`)
  }
}

async function emdashRequest<T>(path: string, init: RequestInit, env: Env, fetcher: Fetcher): Promise<T> {
  if (!env.EMDASH_API_TOKEN) throw new ApiError(503, 'EMDASH_NOT_CONFIGURED', 'EmDash API Token 尚未設定。')
  const targetUrl = `${emdashBaseUrl(env.EMDASH_SITE_URL, 'Site URL')}${path}`
  const response = await (
    env.EMDASH_SERVICE
      ? env.EMDASH_SERVICE.fetch(targetUrl, {
          ...init,
          headers: {
            Authorization: `Bearer ${env.EMDASH_API_TOKEN}`,
            'Content-Type': 'application/json',
            ...init.headers,
          },
        })
      : fetcher(targetUrl, {
          ...init,
          headers: {
            Authorization: `Bearer ${env.EMDASH_API_TOKEN}`,
            'Content-Type': 'application/json',
            ...init.headers,
          },
        })
  ).catch(() => null)
  if (!response) throw new ApiError(502, 'EMDASH_UNAVAILABLE', '目前無法連線到 EmDash。')
  const responseText = await response.text()
  const payload = (() => {
    try {
      return JSON.parse(responseText) as {
        success?: boolean
        data?: T
        error?: { code?: string; message?: string }
      }
    } catch {
      return null
    }
  })()
  if (!response.ok || !payload?.success || !payload.data) {
    console.error('EmDash request failed', {
      path,
      status: response.status,
      code: payload?.error?.code || 'UNKNOWN',
      message: payload?.error?.message || 'Unknown EmDash error',
    })
    throw new ApiError(502, 'EMDASH_ERROR', 'EmDash 無法完成部署，請檢查站台與 Token 設定。')
  }
  return payload.data
}

export async function prepareBrandCheckout(
  input: BrandCheckoutInput,
  env: Env,
  fetcher: Fetcher,
): Promise<{
  handoffId: string
  slug: string
  checkoutUrl: string
  previewUrl: string
  createdAt: number
}> {
  const collection = clean(env.EMDASH_COLLECTION || 'sites', 60)
  if (!/^[a-z][a-z0-9_-]*$/u.test(collection)) throw new ApiError(503, 'EMDASH_NOT_CONFIGURED', 'EmDash Collection 設定不正確。')
  const slug = input.handoff?.slug || `brand-${crypto.randomUUID().slice(0, 8)}`
  const data = {
    name: input.name,
    template: 'editorial',
    template_key: input.template,
    html: input.html,
    category: input.site.category,
    logo_url: input.site.logoUrl || '',
    palette_key: input.site.paletteKey || '',
    tagline: input.site.tagline,
    description: input.site.description,
    address: input.site.address,
    phone: input.site.phone,
    google_maps_url: input.site.googleMapsUrl,
    line_url: input.site.lineUrl,
    instagram_url: input.site.instagramUrl,
    video_url: input.site.videoUrl,
    service_1: input.site.services[0] || '',
    service_2: input.site.services[1] || '',
    service_3: input.site.services[2] || '',
    offering_1: input.site.offerings[0] || '',
    offering_2: input.site.offerings[1] || '',
    offering_3: input.site.offerings[2] || '',
    hours: input.site.hours.map((item) => `${item.label}｜${item.value}`).join('\n'),
    photo_1_url: input.site.photos[0]?.url || '',
    photo_1_alt: input.site.photos[0]?.alt || '',
    photo_2_url: input.site.photos[1]?.url || '',
    photo_2_alt: input.site.photos[1]?.alt || '',
    photo_3_url: input.site.photos[2]?.url || '',
    photo_3_alt: input.site.photos[2]?.alt || '',
    photo_4_url: input.site.photos[3]?.url || '',
    photo_4_alt: input.site.photos[3]?.alt || '',
    photo_5_url: input.site.photos[4]?.url || '',
    photo_5_alt: input.site.photos[4]?.alt || '',
    expires_at: new Date(input.expiresAt).toISOString(),
  }
  let item: EmDashItem
  if (input.handoff) {
    const result = await emdashRequest<{ item: EmDashItem }>(
      `/_emdash/api/content/${collection}/${encodeURIComponent(input.handoff.handoffId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ slug, status: 'draft', data }),
      },
      env,
      fetcher,
    )
    item = result.item
  } else {
    const result = await emdashRequest<{ item: EmDashItem }>(
      `/_emdash/api/content/${collection}`,
      {
        method: 'POST',
        body: JSON.stringify({ slug, status: 'draft', data }),
      },
      env,
      fetcher,
    )
    item = result.item
  }
  if (input.launchMode === 'public') {
    await emdashRequest<{ item: EmDashItem }>(
      `/_emdash/api/content/${collection}/${encodeURIComponent(item.id)}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      env,
      fetcher,
    )
  }
  const checkoutUrl = new URL(env.LIHI_DOMAIN_SEARCH_URL || 'https://lihi.io/go/search')
  if (checkoutUrl.protocol !== 'https:') throw new ApiError(503, 'CHECKOUT_NOT_CONFIGURED', '網域購買網址設定不正確。')
  checkoutUrl.searchParams.set('s', input.domainQuery || input.name)
  checkoutUrl.searchParams.set('source', `miaochuang:${item.id}`)
  const previewUrl = `${emdashBaseUrl(env.EMDASH_SITE_URL, 'Site URL')}/s/${encodeURIComponent(slug)}`
  return {
    handoffId: item.id,
    slug,
    checkoutUrl: checkoutUrl.toString(),
    previewUrl,
    createdAt: Date.now(),
  }
}

export async function generateContent(brief: BrandBrief, env: Env, fetcher: Fetcher): Promise<GeneratedContent> {
  if (!env.OPENROUTER_API_KEY) throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'AI 生成服務尚未完成設定。')
  const primary = env.OPENROUTER_TEXT_MODEL?.trim() || 'openai/gpt-5.6-luna'
  const fallback = env.OPENROUTER_FALLBACK_MODEL?.trim() || 'anthropic/claude-haiku-5.5'
  const facts = [`產業：${brief.industry}`, `品牌：${brief.brandName}`, `三個優勢：${brief.advantages.join('、')}`, `主要服務／商品：${brief.offerings.filter(Boolean).join('、')}`, `營業時間：${brief.hours || '未提供'}`].join('\n')
  const paletteCatalog = paletteIds.map((id) => `${id}=${palettes[id].name}（${palettes[id].mood}）`).join('、')
  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.PUBLIC_APP_URL || 'https://lihi.io/tools/',
      'X-OpenRouter-Title': 'Miaochuang Site',
    },
    body: JSON.stringify({
      model: primary,
      ...(fallback ? { models: [primary, fallback], route: 'fallback' } : {}),
      messages: [
        {
          role: 'system',
          content: '你是台灣在地服務業網站的資深繁中編輯與品牌色彩顧問。只能改寫使用者提供的事實。不得新增價格、折扣、地址、年資、證照、獎項、客戶數、療效、保證或未提供的服務。缺少的資料不要補。色系只能從提供的安全色票中挑選三組不同選項，依品牌適合程度排序。只能輸出符合指定 schema 的 JSON。',
        },
        {
          role: 'user',
          content: `${facts}\n可選安全色票：${paletteCatalog}\n請以 JSON 格式產出一個 20 字內主標題、80–140 字品牌介紹、三個依原始優勢逐項改寫的短標題，以及三組最適合此品牌的 paletteKeys。`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'brand_site_content',
          strict: true,
          schema: contentSchema,
        },
      },
      provider: { require_parameters: true },
      reasoning: { effort: 'none' },
      max_tokens: 1_200,
    }),
  }).catch(() => null)

  if (!response) throw new ApiError(502, 'UPSTREAM_UNAVAILABLE', 'AI 服務目前無法連線，請稍後再試。')
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as {
      error?: { code?: string | number; message?: string }
    } | null
    console.error('OpenRouter request failed', {
      status: response.status,
      code: errorPayload?.error?.code || 'UNKNOWN',
      message: errorPayload?.error?.message || 'Unknown OpenRouter error',
    })
    throw new ApiError(502, 'UPSTREAM_ERROR', 'AI 服務目前忙碌或額度不足，請稍後再試。')
  }
  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{
      finish_reason?: string
      message?: { content?: string; reasoning?: string }
    }>
    usage?: {
      completion_tokens?: number
      completion_tokens_details?: { reasoning_tokens?: number }
    }
  } | null
  const output = payload?.choices?.[0]?.message?.content
  if (!output) {
    console.error('OpenRouter returned no visible content', {
      finishReason: payload?.choices?.[0]?.finish_reason || 'UNKNOWN',
      completionTokens: payload?.usage?.completion_tokens || 0,
      reasoningTokens: payload?.usage?.completion_tokens_details?.reasoning_tokens || 0,
      reasoningLength: payload?.choices?.[0]?.message?.reasoning?.length || 0,
    })
    throw new ApiError(502, 'INVALID_AI_RESPONSE', 'AI 沒有回傳完整網站文案，請再試一次。')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(output)
  } catch {
    throw new ApiError(502, 'INVALID_AI_RESPONSE', 'AI 回傳格式不正確，請再試一次。')
  }
  return parseGenerated(decoded)
}

export async function suggestDomains(input: DomainSuggestionInput, env: Env, fetcher: Fetcher): Promise<string[]> {
  if (!env.OPENROUTER_API_KEY) throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'AI 推薦服務尚未完成設定。')
  const model = env.OPENROUTER_TEXT_MODEL?.trim() || 'openai/gpt-5.6-luna'
  const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.PUBLIC_APP_URL || 'https://lihi.io/tools/',
      'X-OpenRouter-Title': 'Miaochuang Domain Suggestions',
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: 'none' },
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: '你是品牌命名與網域顧問。根據品牌名稱提出 3 個簡短、易拼、容易記住的 ASCII 網域名稱。不可宣稱可註冊，避免商標字與連字號。若中文品牌包含疊字，可考慮取拼音首字母重複縮寫，例如東東→DD、亮亮→LL、美美→MM。若名稱常見、簡短或可能已被註冊，可考慮加入 168、888 等好記數字後綴。三個結果應包含不同命名方向，只能輸出 JSON。',
        },
        { role: 'user', content: `品牌名稱：${input.brandName}` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'domain_suggestions',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              domains: {
                type: 'array',
                items: {
                  type: 'string',
                  pattern: '^[a-z0-9-]+\\.(com|tw|com\\.tw|co)$',
                },
                minItems: 3,
                maxItems: 3,
              },
            },
            required: ['domains'],
            additionalProperties: false,
          },
        },
      },
    }),
  }).catch(() => null)
  if (!response?.ok) throw new ApiError(502, 'SUGGESTION_FAILED', '目前無法產生網域建議，請稍後再試。')
  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>
  } | null
  const content = payload?.choices?.[0]?.message?.content
  if (!content) throw new ApiError(502, 'SUGGESTION_FAILED', '網域推薦沒有回傳結果。')
  const decoded = JSON.parse(content) as { domains?: unknown[] }
  const domains = (decoded.domains || []).map((domain) => clean(domain, 120).toLowerCase()).filter((domain) => /^[a-z0-9-]+\.(?:com|tw|com\.tw|co)$/u.test(domain))
  if (domains.length !== 3 || new Set(domains).size !== 3) throw new ApiError(502, 'SUGGESTION_FAILED', '網域推薦格式不正確，請再試一次。')
  return domains
}

export async function handleRequest(request: Request, env: Env, fetcher: Fetcher = fetch): Promise<Response> {
  try {
    if (request.method === 'OPTIONS')
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      })
    const origin = request.headers.get('origin')
    if (origin && !allowedOrigin(request, env)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', '這個網站來源不允許使用生成服務。')
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') return json(request, env, { ok: true, provider: 'openrouter' })
    const body = await request.json().catch(() => null)
    if (request.method === 'POST' && url.pathname === '/api/generate-content') {
      return json(request, env, await generateContent(parseBrief(body), env, fetcher))
    }
    if (request.method === 'POST' && url.pathname === '/api/domain-suggestions') {
      const remaining = env.DOMAIN_SUGGESTION_LIMIT_ENABLED === 'true' ? await consumeSuggestionQuota(request, env) : null
      return json(request, env, {
        suggestions: await suggestDomains(parseDomainSuggestionInput(body), env, fetcher),
        remaining,
      })
    }
    if (request.method === 'POST' && url.pathname === '/api/brand-checkout') {
      return json(request, env, await prepareBrandCheckout(parseBrandCheckoutInput(body), env, fetcher))
    }
    throw new ApiError(404, 'NOT_FOUND', '找不到這個 API 路徑。')
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', '生成網站時發生錯誤，請稍後再試。')
    if (!(error instanceof ApiError)) console.error(error)
    return json(request, env, { error: { code: apiError.code, message: apiError.message } }, apiError.status)
  }
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>

export class SuggestionLimiter implements DurableObject {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(): Promise<Response> {
    const count = (await this.state.storage.get<number>('count')) || 0
    if (count >= 5) return Response.json({ allowed: false, remaining: 0 })
    const next = count + 1
    await this.state.storage.put('count', next)
    return Response.json({ allowed: true, remaining: 5 - next })
  }
}
