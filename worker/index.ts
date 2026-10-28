type Fetcher = typeof fetch

export interface Env {
  GOOGLE_MAPS_API_KEY: string
  PHOTO_SIGNING_SECRET: string
  ALLOWED_ORIGINS?: string
}

type LocalizedText = { text?: string; languageCode?: string }

type GooglePhoto = {
  name?: string
  googleMapsUri?: string
  flagContentUri?: string
  authorAttributions?: Array<{
    displayName?: string
    uri?: string
    photoUri?: string
  }>
}

type GoogleReview = {
  name?: string
  rating?: number
  text?: LocalizedText
  originalText?: LocalizedText
  relativePublishTimeDescription?: string
  publishTime?: string
  googleMapsUri?: string
  flagContentUri?: string
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
}

type GooglePlace = {
  id?: string
  displayName?: LocalizedText
  primaryTypeDisplayName?: LocalizedText
  formattedAddress?: string
  nationalPhoneNumber?: string
  googleMapsUri?: string
  websiteUri?: string
  businessStatus?: string
  location?: { latitude?: number; longitude?: number }
  regularOpeningHours?: { weekdayDescriptions?: string[] }
  photos?: GooglePhoto[]
  reviews?: GoogleReview[]
  rating?: number
  userRatingCount?: number
}

type PlaceSource = {
  placeId?: string
  query?: string
  latitude?: number
  longitude?: number
}

const GOOGLE_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'])
const PLACE_FIELDS = [
  'id',
  'displayName',
  'primaryTypeDisplayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'googleMapsUri',
  'websiteUri',
  'businessStatus',
  'regularOpeningHours',
  'photos',
  'reviews',
  'rating',
  'userRatingCount',
].join(',')

function isGoogleHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return GOOGLE_HOSTS.has(host) || host.endsWith('.google.com')
}

function assertGoogleUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new ApiError(400, 'INVALID_GOOGLE_URL', '請貼上完整的 Google 地圖商家網址。')
  }
  if (url.protocol !== 'https:' || !isGoogleHost(url.hostname)) {
    throw new ApiError(400, 'INVALID_GOOGLE_URL', '目前只支援 HTTPS Google 地圖商家網址。')
  }
  return url
}

function parseCoordinates(url: URL): Pick<PlaceSource, 'latitude' | 'longitude'> {
  const match = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (!match) return {}
  return { latitude: Number(match[1]), longitude: Number(match[2]) }
}

export function extractPlaceSource(value: string): PlaceSource {
  const url = assertGoogleUrl(value)
  const explicitPlaceId = url.searchParams.get('query_place_id')
  if (explicitPlaceId) return { placeId: explicitPlaceId, ...parseCoordinates(url) }

  const rawQuery = url.searchParams.get('query') || url.searchParams.get('q')
  if (rawQuery) {
    const placeId = rawQuery.match(/^place_id:(.+)$/i)?.[1]
    return placeId
      ? { placeId, ...parseCoordinates(url) }
      : { query: rawQuery.trim(), ...parseCoordinates(url) }
  }

  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/i)
  if (placeMatch) {
    return {
      query: decodeURIComponent(placeMatch[1].replaceAll('+', ' ')).trim(),
      ...parseCoordinates(url),
    }
  }
  throw new ApiError(422, 'PLACE_QUERY_NOT_FOUND', '無法從這個網址辨識店家，請在 Google 地圖開啟店家後重新複製分享連結。')
}

async function resolveShortUrl(sourceUrl: string, fetcher: Fetcher): Promise<string> {
  let current = assertGoogleUrl(sourceUrl)
  for (let index = 0; index < 6 && ['maps.app.goo.gl', 'goo.gl'].includes(current.hostname); index += 1) {
    const response = await fetcher(current.toString(), { method: 'GET', redirect: 'manual' })
    const location = response.headers.get('location')
    if (!location) {
      if (response.url && response.url !== current.toString()) return assertGoogleUrl(response.url).toString()
      break
    }
    current = assertGoogleUrl(new URL(location, current).toString())
  }
  return current.toString()
}

async function googleJson<T>(url: string, env: Env, fetcher: Fetcher, init: RequestInit = {}): Promise<T> {
  const response = await fetcher(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
      ...(init.headers || {}),
    },
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Google Places request failed', response.status, detail.slice(0, 300))
    throw new ApiError(502, 'GOOGLE_PLACES_ERROR', 'Google 商家資料暫時無法取得，請稍後再試。')
  }
  return response.json() as Promise<T>
}

async function findPlace(source: PlaceSource, env: Env, fetcher: Fetcher): Promise<string> {
  if (source.placeId) return source.placeId
  if (!source.query) throw new ApiError(422, 'PLACE_QUERY_NOT_FOUND', '無法辨識店家名稱。')

  const body: Record<string, unknown> = {
    textQuery: source.query,
    languageCode: 'zh-TW',
    regionCode: 'TW',
    pageSize: 3,
  }
  if (source.latitude !== undefined && source.longitude !== undefined) {
    body.locationBias = {
      circle: {
        center: { latitude: source.latitude, longitude: source.longitude },
        radius: 1000,
      },
    }
  }
  const result = await googleJson<{ places?: GooglePlace[] }>(
    'https://places.googleapis.com/v1/places:searchText',
    env,
    fetcher,
    {
      method: 'POST',
      headers: { 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location' },
      body: JSON.stringify(body),
    },
  )
  const placeId = result.places?.[0]?.id
  if (!placeId) throw new ApiError(404, 'PLACE_NOT_FOUND', '找不到這間 Google 商家，請確認網址後再試。')
  return placeId
}

async function getPlace(placeId: string, env: Env, fetcher: Fetcher): Promise<GooglePlace> {
  return googleJson<GooglePlace>(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=zh-TW&regionCode=TW`,
    env,
    fetcher,
    { headers: { 'X-Goog-FieldMask': PLACE_FIELDS } },
  )
}

function toBase64Url(value: Uint8Array): string {
  let binary = ''
  value.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toBase64Url(new Uint8Array(signature))
}

export async function createPhotoToken(photoName: string, secret: string): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(photoName))
  return `${payload}.${await hmac(payload, secret)}`
}

async function readPhotoToken(token: string, secret: string): Promise<string> {
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra || signature !== await hmac(payload, secret)) {
    throw new ApiError(403, 'INVALID_PHOTO_TOKEN', '照片連結已失效，請重新匯入商家資料。')
  }
  const name = new TextDecoder().decode(fromBase64Url(payload))
  if (!/^places\/[^/]+\/photos\/[^/]+$/u.test(name)) {
    throw new ApiError(403, 'INVALID_PHOTO_TOKEN', '照片連結格式不正確。')
  }
  return name
}

function splitHours(value: string): { label: string; value: string } {
  const index = value.search(/[:：]/u)
  return index < 0
    ? { label: value.trim(), value: '' }
    : { label: value.slice(0, index).trim(), value: value.slice(index + 1).trim() }
}

export async function mapPlaceToDraft(place: GooglePlace, sourceUrl: string, apiOrigin: string, env: Env) {
  const name = place.displayName?.text?.trim() || '未命名店家'
  const category = place.primaryTypeDisplayName?.text?.trim() || '在地商家'
  const address = place.formattedAddress?.trim() || ''
  const photos = await Promise.all((place.photos || []).slice(0, 12).map(async (photo, index) => {
    const attribution = photo.authorAttributions?.[0]
    const token = photo.name ? await createPhotoToken(photo.name, env.PHOTO_SIGNING_SECRET) : ''
    return {
      id: photo.name || `google-photo-${index + 1}`,
      url: token ? `${apiOrigin}/api/photo?token=${encodeURIComponent(token)}` : '',
      alt: `${name}店家照片 ${index + 1}`,
      selected: index < 5,
      source: 'google_places' as const,
      sourceUrl: photo.googleMapsUri || place.googleMapsUri || '',
      authorName: attribution?.displayName || '',
      authorUrl: attribution?.uri || '',
      authorAvatarUrl: attribution?.photoUri || '',
      reportUrl: photo.flagContentUri || '',
    }
  }))

  const reviews = (place.reviews || []).slice(0, 5).map((review, index) => ({
    id: review.name || `google-review-${index + 1}`,
    author: review.authorAttribution?.displayName || 'Google 使用者',
    authorUrl: review.authorAttribution?.uri || '',
    authorAvatarUrl: review.authorAttribution?.photoUri || '',
    rating: Math.max(1, Math.min(5, Math.round(review.rating || 5))),
    text: review.originalText?.text || review.text?.text || '',
    relativeTime: review.relativePublishTimeDescription || '',
    sourceUrl: review.googleMapsUri || place.googleMapsUri || '',
    reportUrl: review.flagContentUri || '',
    selected: true,
    source: 'google_places' as const,
  })).filter((review) => review.text)

  const now = Date.now()
  return {
    sourceUrl,
    source: 'google_places' as const,
    googlePlaceId: place.id || '',
    name,
    category,
    tagline: `認識 ${name}`,
    description: [name, address ? `位於${address}` : '', category ? `分類為${category}` : ''].filter(Boolean).join('，') + '。',
    address,
    phone: place.nationalPhoneNumber || '',
    googleMapsUrl: place.googleMapsUri || sourceUrl,
    lineUrl: '',
    instagramUrl: '',
    videoUrl: '',
    services: [],
    hours: (place.regularOpeningHours?.weekdayDescriptions || []).map(splitHours),
    photos: photos.filter((photo) => photo.url),
    reviews,
    template: 'editorial' as const,
    accent: '#b85d3f',
    regenerationCount: 0,
    createdAt: now,
    expiresAt: now + 48 * 60 * 60 * 1000,
  }
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
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

function json(request: Request, env: Env, data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders(request, env) })
}

async function handleImport(request: Request, env: Env, fetcher: Fetcher): Promise<Response> {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigin(request, env)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', '這個網站來源不允許使用匯入服務。')
  const body = await request.json().catch(() => null) as { sourceUrl?: unknown } | null
  if (!body || typeof body.sourceUrl !== 'string' || body.sourceUrl.length > 2048) {
    throw new ApiError(400, 'INVALID_REQUEST', '缺少有效的 Google 商家網址。')
  }
  const resolvedUrl = await resolveShortUrl(body.sourceUrl, fetcher)
  const source = extractPlaceSource(resolvedUrl)
  const placeId = await findPlace(source, env, fetcher)
  const place = await getPlace(placeId, env, fetcher)
  if (place.businessStatus === 'CLOSED_PERMANENTLY') {
    throw new ApiError(422, 'PLACE_CLOSED', '這間店家已顯示為永久停業，暫不支援建立網站。')
  }
  const draft = await mapPlaceToDraft(place, body.sourceUrl, new URL(request.url).origin, env)
  return json(request, env, { mode: 'live', draft })
}

async function handlePhoto(request: Request, env: Env, fetcher: Fetcher): Promise<Response> {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigin(request, env)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', '這個網站來源不允許使用照片服務。')
  const token = new URL(request.url).searchParams.get('token') || ''
  const name = await readPhotoToken(token, env.PHOTO_SIGNING_SECRET)
  const response = await fetcher(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=1600&maxHeightPx=1600`, {
    headers: { 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY },
    redirect: 'follow',
  })
  if (!response.ok || !response.body) throw new ApiError(502, 'PHOTO_UNAVAILABLE', '這張 Google 商家照片暫時無法載入。')
  const headers = new Headers(corsHeaders(request, env))
  headers.set('Content-Type', response.headers.get('content-type') || 'image/jpeg')
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  return new Response(response.body, { status: 200, headers })
}

export async function handleRequest(request: Request, env: Env, fetcher: Fetcher = fetch): Promise<Response> {
  try {
    if (!env.GOOGLE_MAPS_API_KEY || !env.PHOTO_SIGNING_SECRET) {
      throw new ApiError(503, 'SERVICE_NOT_CONFIGURED', '商家匯入服務尚未完成設定。')
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/api/import-place') return await handleImport(request, env, fetcher)
    if (request.method === 'GET' && url.pathname === '/api/photo') return await handlePhoto(request, env, fetcher)
    if (request.method === 'GET' && url.pathname === '/health') return json(request, env, { ok: true })
    throw new ApiError(404, 'NOT_FOUND', '找不到這個 API 路徑。')
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(500, 'INTERNAL_ERROR', '匯入商家資料時發生錯誤，請稍後再試。')
    if (!(error instanceof ApiError)) console.error(error)
    return json(request, env, { error: { code: apiError.code, message: apiError.message } }, apiError.status)
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env)
  },
} satisfies ExportedHandler<Env>
