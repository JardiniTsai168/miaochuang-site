import { renderSite } from './renderSite'
import type { BusinessDraft } from '../types'

const API_BASE_URL = (import.meta.env.VITE_GENERATION_API_BASE_URL || '').replace(/\/$/u, '')

export type EmDashDeployment = NonNullable<BusinessDraft['emdash']>

export class DeploymentError extends Error {
  constructor(message: string, public code = 'DEPLOYMENT_FAILED') {
    super(message)
  }
}

export async function deployToEmDash(draft: BusinessDraft): Promise<EmDashDeployment> {
  const deployableDraft: BusinessDraft = {
    ...draft,
    photos: draft.photos.map((photo) => ({
      ...photo,
      url: /^\/(?!\/)/u.test(photo.url) ? new URL(photo.url, window.location.origin).toString() : photo.url,
    })),
  }
  const response = await fetch(`${API_BASE_URL}/api/deploy-emdash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: draft.name,
      template: draft.template,
      expiresAt: draft.expiresAt,
      html: renderSite(deployableDraft, { noindex: true }),
      deployment: draft.emdash ? { entryId: draft.emdash.entryId, slug: draft.emdash.slug } : undefined,
    }),
  }).catch(() => null)

  if (!response) throw new DeploymentError('目前無法連線到 EmDash 部署服務。', 'SERVICE_UNAVAILABLE')
  const payload = await response.json().catch(() => null) as (EmDashDeployment & { error?: { code?: string; message?: string } }) | null
  if (!response.ok) throw new DeploymentError(payload?.error?.message || 'EmDash 部署失敗，請稍後再試。', payload?.error?.code)
  if (!payload?.entryId || !payload.slug || !payload.url) throw new DeploymentError('EmDash 回傳的部署資料不完整。', 'INVALID_RESPONSE')
  return payload
}
