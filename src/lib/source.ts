import { createDemoBusiness } from '../data/demoBusiness'
import type { ImportResult } from '../types'

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

export async function importBusiness(sourceUrl: string): Promise<ImportResult> {
  if (!isGoogleBusinessUrl(sourceUrl)) {
    throw new Error('請貼上完整的 Google 地圖商家網址，例如 https://maps.app.goo.gl/...')
  }

  const response = await fetch('/api/import-place', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceUrl }),
  }).catch(() => null)

  if (response?.ok && response.headers.get('content-type')?.includes('application/json')) {
    try {
      return (await response.json()) as ImportResult
    } catch {
      // Fall through to the explicit demo mode while the backend is not connected.
    }
  }

  // The UI remains fully testable before the Google Places credential is connected.
  await new Promise((resolve) => window.setTimeout(resolve, 900))
  return {
    draft: { ...createDemoBusiness(), sourceUrl },
    mode: 'demo',
  }
}
