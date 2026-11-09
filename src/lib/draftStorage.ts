import type { BusinessDraft } from '../types'
import { createIndustryPhotos } from '../data/industryPhotos'

const KEY = 'miaochuang-draft-v2'

export function saveDraft(draft: BusinessDraft): void {
  localStorage.setItem(KEY, JSON.stringify(draft))
}

export function loadDraft(now = Date.now()): BusinessDraft | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null

  try {
    const draft = JSON.parse(raw) as BusinessDraft
    if (!draft.expiresAt || draft.expiresAt <= now) {
      localStorage.removeItem(KEY)
      return null
    }
    if (draft.source === 'generated' && draft.photos.some((photo) => photo.url.includes('/demo/generic/'))) {
      const migrated = { ...draft, photos: createIndustryPhotos(draft.category, draft.offerings) }
      saveDraft(migrated)
      return migrated
    }
    return draft
  } catch {
    localStorage.removeItem(KEY)
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY)
}

export function formatRemainingTime(expiresAt: number, now = Date.now()): string {
  const remaining = Math.max(0, expiresAt - now)
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
  if (days >= 1) return `${days} 天`
  const hours = Math.ceil(remaining / (60 * 60 * 1000))
  return `${hours} 小時`
}
