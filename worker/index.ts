export interface Env {
  OPENAI_API_KEY: string
  OPENAI_TEXT_MODEL?: string
  OPENAI_IMAGE_MODEL?: string
  ALLOWED_ORIGINS?: string
}

type Fetcher = typeof fetch

type BrandBrief = {
  industry: string
  brandName: string
  advantages: [string, string, string]
  hours?: string
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  const allowed = new Set((env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean))
  return allowed.has(origin) ? origin : null
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = allowedOrigin(request, env)
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function json(request: Request, env: Env, value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: corsHeaders(request, env) })
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function parseBrief(value: unknown): BrandBrief {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const advantages = Array.isArray(body.advantages) ? body.advantages.map((item) => clean(item, 100)) : []
  const brief: BrandBrief = {
    industry: clean(body.industry, 80),
    brandName: clean(body.brandName, 80),
    advantages: [advantages[0] || '', advantages[1] || '', advantages[2] || ''],
    hours: clean(body.hours, 500),
  }
  if (!brief.industry || !brief.brandName || brief.advantages.some((item) => !item)) {
    throw new ApiError(400, 'INVALID_BRIEF', '請完整填寫產業、品牌名稱與三個優點。')
  }
  return brief
}

async function openAI<T>(path: string, body: unknown, env: Env, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(`https://api.openai.com/v1${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('OpenAI request failed', response.status, detail.slice(0, 300))
    if (response.status === 429) throw new ApiError(429, 'AI_RATE_LIMITED', 'AI 生成服務目前忙碌，請稍後再試。')
    throw new ApiError(502, 'AI_GENERATION_FAILED', 'AI 暫時無法完成生成，請稍後再試。')
  }
  return response.json() as Promise<T>
}

function outputText(response: { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> }): string {
  for (const item of response.output || []) {
    for (const content of item.content || []) if (content.type === 'output_text' && content.text) return content.text
  }
  throw new ApiError(502, 'INVALID_AI_RESPONSE', 'AI 回傳的文案格式不正確，請再試一次。')
}

const contentSchema = {
  type: 'object',
  properties: {
    tagline: { type: 'string' },
    description: { type: 'string' },
    services: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
    photoPrompts: { type: 'array', items: { type: 'string' }, minItems: 8, maxItems: 8 },
    photoAlts: { type: 'array', items: { type: 'string' }, minItems: 8, maxItems: 8 },
  },
  required: ['tagline', 'description', 'services', 'photoPrompts', 'photoAlts'],
  additionalProperties: false,
}

export async function generateContent(brief: BrandBrief, env: Env, fetcher: Fetcher): Promise<unknown> {
  const facts = `產業：${brief.industry}\n品牌：${brief.brandName}\n三個優勢：${brief.advantages.join('、')}\n營業時間：${brief.hours || '未提供'}`
  const roles = '1 品牌主視覺、2 主理人工作情境、3 顧客體驗、4 核心產品或服務、5 製作過程、6 空間全景、7 細節特寫、8 門面或品牌識別'
  const response = await openAI<{ output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> }>('/responses', {
    model: env.OPENAI_TEXT_MODEL || 'gpt-6-astra',
    input: [
      { role: 'system', content: '你是台灣品牌網站的資深文案與 art director。只能使用使用者提供的事實，不得捏造地址、獎項、價格、創立年份或產品。產出繁體中文文案；影像 prompt 使用英文，要求商業攝影、自然人物與一致 art direction，禁止文字、logo、水印。' },
      { role: 'user', content: `${facts}\n請產出：20 字內主標題、80–140 字介紹、三個由優勢改寫的服務標題，以及 8 張網站照片的英文 prompt 與繁中 alt。照片角色固定為：${roles}。每個 prompt 都要重述產業、品牌調性與對應角色，人物以台灣在地情境為主。` },
    ],
    text: { format: { type: 'json_schema', name: 'brand_site_content', strict: true, schema: contentSchema } },
  }, env, fetcher)
  return JSON.parse(outputText(response))
}

async function safetyIdentifier(brandName: string, industry: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${industry}:${brandName}`))
  return `brand-${Array.from(new Uint8Array(digest)).slice(0, 12).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export async function generateImage(body: Record<string, unknown>, env: Env, fetcher: Fetcher): Promise<string> {
  const prompt = clean(body.prompt, 5000)
  const brandName = clean(body.brandName, 80)
  const industry = clean(body.industry, 80)
  if (!prompt || !brandName || !industry) throw new ApiError(400, 'INVALID_IMAGE_REQUEST', '缺少品牌影像生成資料。')
  const response = await openAI<{ data?: Array<{ b64_json?: string }>; output_format?: string }>('/images/generations', {
    model: env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare',
    prompt,
    n: 1,
    size: '1536x1024',
    quality: 'low',
    output_format: 'jpeg',
    output_compression: 82,
    background: 'opaque',
    safety_identifier: await safetyIdentifier(brandName, industry),
  }, env, fetcher)
  const encoded = response.data?.[0]?.b64_json
  if (!encoded) throw new ApiError(502, 'INVALID_IMAGE_RESPONSE', 'AI 沒有回傳完整影像，請再試一次。')
  return `data:image/${response.output_format || 'jpeg'};base64,${encoded}`
}

export async function handleRequest(request: Request, env: Env, fetcher: Fetcher = fetch): Promise<Response> {
  try {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    if (!env.OPENAI_API_KEY) throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', 'AI 生成服務尚未完成設定。')
    const origin = request.headers.get('origin')
    if (origin && !allowedOrigin(request, env)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', '這個網站來源不允許使用生成服務。')
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') return json(request, env, { ok: true })
    const body = await request.json().catch(() => null)
    if (request.method === 'POST' && url.pathname === '/api/generate-content') {
      return json(request, env, await generateContent(parseBrief(body), env, fetcher))
    }
    if (request.method === 'POST' && url.pathname === '/api/generate-image') {
      return json(request, env, { dataUrl: await generateImage((body || {}) as Record<string, unknown>, env, fetcher) })
    }
    throw new ApiError(404, 'NOT_FOUND', '找不到這個 API 路徑。')
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', '生成網站時發生錯誤，請稍後再試。')
    if (!(error instanceof ApiError)) console.error(error)
    return json(request, env, { error: { code: apiError.code, message: apiError.message } }, apiError.status)
  }
}

export default { fetch: (request: Request, env: Env) => handleRequest(request, env) } satisfies ExportedHandler<Env>
