import { createDemoBusiness } from '../data/demoBusiness'
import type { ImportResult } from '../types'

const IMPORT_API_BASE_URL = (import.meta.env.VITE_IMPORT_API_BASE_URL || '').replace(/\/$/u, '')

const GOOGLE_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
])

export function isGoogleBusinessUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && GOOGLE_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

export class ImportBusinessError extends Error {
  constructor(message: string, public code = 'IMPORT_FAILED') {
    super(message)
  }
}

export async function importBusiness(sourceUrl: string): Promise<ImportResult> {
  if (!isGoogleBusinessUrl(sourceUrl)) {
    throw new Error('請貼上完整的 Google 地圖商家網址，例如 https://maps.app.goo.gl/...')
  }

  const demo = createDemoBusiness()
  if (sourceUrl === demo.sourceUrl) return { draft: demo, mode: 'demo' }

  const response = await fetch(`${IMPORT_API_BASE_URL}/api/import-place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceUrl }),
  }).catch(() => null)

  if (!response) {
    throw new ImportBusinessError('目前無法連線到 Google 商家匯入服務，請稍後再試。', 'IMPORT_SERVICE_UNAVAILABLE')
  }
  const body = await response.json().catch(() => null) as (ImportResult & { error?: { code?: string; message?: string } }) | null
  if (!response.ok) {
    throw new ImportBusinessError(body?.error?.message || 'Google 商家資料匯入失敗，請確認網址後再試。', body?.error?.code)
  }
  if (!body?.draft || body.mode !== 'live') throw new ImportBusinessError('匯入服務回傳的資料格式不正確。', 'INVALID_IMPORT_RESPONSE')
  return body
}
