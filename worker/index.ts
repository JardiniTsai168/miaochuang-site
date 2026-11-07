export type Env = {
  OPENROUTER_API_KEY: string
  OPENROUTER_TEXT_MODEL?: string
  OPENROUTER_FALLBACK_MODEL?: string
  PUBLIC_APP_URL?: string
  ALLOWED_ORIGINS?: string
  EMDASH_SITE_URL?: string
  EMDASH_PUBLIC_URL?: string
  EMDASH_API_TOKEN?: string
  EMDASH_COLLECTION?: string
  EMDASH_PUBLIC_PATH?: string
  EMDASH_SERVICE?: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> }
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
}

type EmDashDeployInput = {
  name: string
  template: string
  expiresAt: number
  html: string
  deployment?: { entryId: string; slug: string }
}

type EmDashItem = { id: string; slug: string | null }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
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
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean)
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
    description: { type: 'string', description: '80 到 140 個繁體中文字的品牌介紹' },
    advantages: {
      type: 'array',
      description: '依使用者三個優勢分別改寫的短標題，不得新增事實',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ['tagline', 'description', 'advantages'],
  additionalProperties: false,
}

function parseGenerated(value: unknown): GeneratedContent {
  const content = (value || {}) as Record<string, unknown>
  const advantages = Array.isArray(content.advantages) ? content.advantages.map((item) => clean(item, 80)) : []
  const generated: GeneratedContent = {
    tagline: clean(content.tagline, 80),
    description: clean(content.description, 600),
    advantages: [advantages[0] || '', advantages[1] || '', advantages[2] || ''],
  }
  if (!generated.tagline || !generated.description || generated.advantages.some((item) => !item)) {
    throw new ApiError(502, 'INVALID_AI_RESPONSE', 'AI 沒有回傳完整網站文案，請再試一次。')
  }
  return generated
}

function parseDeployInput(value: unknown): EmDashDeployInput {
  const body = (value || {}) as Record<string, unknown>
  const rawDeployment = body.deployment && typeof body.deployment === 'object' ? body.deployment as Record<string, unknown> : undefined
  const deployment = rawDeployment ? { entryId: clean(rawDeployment.entryId, 120), slug: clean(rawDeployment.slug, 120) } : undefined
  const input: EmDashDeployInput = {
    name: clean(body.name, 80),
    template: clean(body.template, 40),
    expiresAt: typeof body.expiresAt === 'number' ? body.expiresAt : 0,
    html: typeof body.html === 'string' ? body.html : '',
    ...(deployment?.entryId && /^[a-z0-9-]+$/iu.test(deployment.slug) ? { deployment } : {}),
  }
  if (!input.name || !input.template || !input.expiresAt || !input.html || input.html.length > 2_000_000) {
    throw new ApiError(400, 'INVALID_DEPLOYMENT', '部署資料不完整或網站內容超過大小限制。')
  }
  return input
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
  const response = await (env.EMDASH_SERVICE ? env.EMDASH_SERVICE.fetch(targetUrl, {
    ...init,
    headers: { Authorization: `Bearer ${env.EMDASH_API_TOKEN}`, 'Content-Type': 'application/json', ...init.headers },
  }) : fetcher(targetUrl, {
    ...init,
    headers: { Authorization: `Bearer ${env.EMDASH_API_TOKEN}`, 'Content-Type': 'application/json', ...init.headers },
  })).catch(() => null)
  if (!response) throw new ApiError(502, 'EMDASH_UNAVAILABLE', '目前無法連線到 EmDash。')
  const responseText = await response.text()
  const payload = (() => {
    try {
      return JSON.parse(responseText) as { success?: boolean; data?: T; error?: { code?: string; message?: string } }
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

export async function deployToEmDash(input: EmDashDeployInput, env: Env, fetcher: Fetcher): Promise<{ entryId: string; slug: string; url: string; deployedAt: number }> {
  const collection = clean(env.EMDASH_COLLECTION || 'sites', 60)
  if (!/^[a-z][a-z0-9_-]*$/u.test(collection)) throw new ApiError(503, 'EMDASH_NOT_CONFIGURED', 'EmDash Collection 設定不正確。')
  const slug = input.deployment?.slug || `site-${crypto.randomUUID().slice(0, 8)}`
  const data = { name: input.name, template: input.template, html: input.html, expires_at: new Date(input.expiresAt).toISOString() }
  let item: EmDashItem
  if (input.deployment) {
    const result = await emdashRequest<{ item: EmDashItem }>(`/_emdash/api/content/${collection}/${encodeURIComponent(input.deployment.entryId)}`, {
      method: 'PUT', body: JSON.stringify({ slug, data }),
    }, env, fetcher)
    item = result.item
  } else {
    const result = await emdashRequest<{ item: EmDashItem }>(`/_emdash/api/content/${collection}`, {
      method: 'POST', body: JSON.stringify({ slug, status: 'draft', data }),
    }, env, fetcher)
    item = result.item
  }
  await emdashRequest<{ item: EmDashItem }>(`/_emdash/api/content/${collection}/${encodeURIComponent(item.id)}/publish`, {
    method: 'POST', body: '{}',
  }, env, fetcher)
  const publicUrl = emdashBaseUrl(env.EMDASH_PUBLIC_URL || env.EMDASH_SITE_URL, 'Public URL')
  const publicPath = `/${(env.EMDASH_PUBLIC_PATH || 's').replace(/^\/+|\/+$/gu, '')}`
  return { entryId: item.id, slug, url: `${publicUrl}${publicPath}/${encodeURIComponent(slug)}`, deployedAt: Date.now() }
}

export async function generateContent(brief: BrandBrief, env: Env, fetcher: Fetcher): Promise<GeneratedContent> {
  if (!env.OPENROUTER_API_KEY) throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'AI 生成服務尚未完成設定。')
  const primary = env.OPENROUTER_TEXT_MODEL?.trim() || 'openai/gpt-5.6-luna'
  const fallback = env.OPENROUTER_FALLBACK_MODEL?.trim() || 'anthropic/claude-haiku-5.5'
  const facts = [
    `產業：${brief.industry}`,
    `品牌：${brief.brandName}`,
    `三個優勢：${brief.advantages.join('、')}`,
    `主要服務／商品：${brief.offerings.filter(Boolean).join('、')}`,
    `營業時間：${brief.hours || '未提供'}`,
  ].join('\n')
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
          content: '你是台灣在地服務業網站的資深繁中編輯。只能改寫使用者提供的事實。不得新增價格、折扣、地址、年資、證照、獎項、客戶數、療效、保證或未提供的服務。缺少的資料不要補。只能輸出符合指定 schema 的 JSON。',
        },
        {
          role: 'user',
          content: `${facts}\n請以 JSON 格式產出一個 20 字內主標題、80–140 字品牌介紹，以及三個依原始優勢逐項改寫的短標題。`,
        },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'brand_site_content', strict: true, schema: contentSchema } },
      provider: { require_parameters: true },
      reasoning: { effort: 'none' },
      max_tokens: 1_200,
    }),
  }).catch(() => null)

  if (!response) throw new ApiError(502, 'UPSTREAM_UNAVAILABLE', 'AI 服務目前無法連線，請稍後再試。')
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { error?: { code?: string | number; message?: string } } | null
    console.error('OpenRouter request failed', {
      status: response.status,
      code: errorPayload?.error?.code || 'UNKNOWN',
      message: errorPayload?.error?.message || 'Unknown OpenRouter error',
    })
    throw new ApiError(502, 'UPSTREAM_ERROR', 'AI 服務目前忙碌或額度不足，請稍後再試。')
  }
  const payload = await response.json().catch(() => null) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string; reasoning?: string } }>
    usage?: { completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } }
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

export async function handleRequest(request: Request, env: Env, fetcher: Fetcher = fetch): Promise<Response> {
  try {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    const origin = request.headers.get('origin')
    if (origin && !allowedOrigin(request, env)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', '這個網站來源不允許使用生成服務。')
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') return json(request, env, { ok: true, provider: 'openrouter' })
    const body = await request.json().catch(() => null)
    if (request.method === 'POST' && url.pathname === '/api/generate-content') {
      return json(request, env, await generateContent(parseBrief(body), env, fetcher))
    }
    if (request.method === 'POST' && url.pathname === '/api/deploy-emdash') {
      return json(request, env, await deployToEmDash(parseDeployInput(body), env, fetcher))
    }
    throw new ApiError(404, 'NOT_FOUND', '找不到這個 API 路徑。')
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', '生成網站時發生錯誤，請稍後再試。')
    if (!(error instanceof ApiError)) console.error(error)
    return json(request, env, { error: { code: apiError.code, message: apiError.message } }, apiError.status)
  }
}

export default { fetch: (request: Request, env: Env) => handleRequest(request, env) } satisfies ExportedHandler<Env>
