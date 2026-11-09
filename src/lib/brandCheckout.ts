import { renderSite } from './renderSite'
import type { BusinessDraft } from '../types'

const API_BASE_URL = (import.meta.env.VITE_GENERATION_API_BASE_URL || '').replace(/\/$/u, '')

export type BrandCheckout = NonNullable<BusinessDraft['brandCheckout']>

export class BrandCheckoutError extends Error {
  constructor(message: string, public code = 'BRAND_CHECKOUT_FAILED') {
    super(message)
  }
}

export async function createBrandCheckout(draft: BusinessDraft, launchMode: 'public' | 'brand' = 'brand'): Promise<BrandCheckout> {
  const deployableDraft: BusinessDraft = {
    ...draft,
    photos: draft.photos.map((photo) => ({
      ...photo,
      url: /^\/(?!\/)/u.test(photo.url) ? new URL(photo.url, window.location.origin).toString() : photo.url,
    })),
  }
  const response = await fetch(`${API_BASE_URL}/api/brand-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: draft.name,
      template: draft.template,
      expiresAt: draft.expiresAt,
      html: renderSite(deployableDraft, { noindex: true }),
      launchMode,
      handoff: draft.brandCheckout ? { handoffId: draft.brandCheckout.handoffId, slug: draft.brandCheckout.slug } : undefined,
    }),
  }).catch(() => null)

  if (!response) throw new BrandCheckoutError('目前無法連線到品牌建立服務。', 'SERVICE_UNAVAILABLE')
  const payload = await response.json().catch(() => null) as (BrandCheckout & { error?: { code?: string; message?: string } }) | null
  if (!response.ok) throw new BrandCheckoutError(payload?.error?.message || '品牌建立失敗，請稍後再試。', payload?.error?.code)
  if (!payload?.handoffId || !payload.slug || !payload.checkoutUrl || !payload.previewUrl) throw new BrandCheckoutError('品牌建立服務回傳的資料不完整。', 'INVALID_RESPONSE')
  return payload
}
