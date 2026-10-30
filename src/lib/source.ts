import type { BrandBrief, BusinessDraft, BusinessHours, BusinessPhoto, ImportResult } from '../types'

const API_BASE_URL = (import.meta.env.VITE_GENERATION_API_BASE_URL || '').replace(/\/$/u, '')

type GeneratedContent = {
  tagline: string
  description: string
  services: string[]
  photoPrompts: string[]
  photoAlts: string[]
}

export class GenerationError extends Error {
  constructor(message: string, public code = 'GENERATION_FAILED') {
    super(message)
  }
}

function parseHours(value = ''): BusinessHours[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const separator = line.search(/[:：]/u)
    if (separator < 0) return { label: index === 0 ? '營業時間' : '', value: line }
    return { label: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() }
  })
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  if (!response) throw new GenerationError('目前無法連線到 AI 生成服務，請稍後再試。', 'SERVICE_UNAVAILABLE')
  const payload = await response.json().catch(() => null) as (T & { error?: { code?: string; message?: string } }) | null
  if (!response.ok) throw new GenerationError(payload?.error?.message || '網站內容生成失敗，請稍後再試。', payload?.error?.code)
  if (!payload) throw new GenerationError('生成服務回傳的資料格式不正確。', 'INVALID_RESPONSE')
  return payload
}

export function validateBrief(brief: BrandBrief): string {
  if (!brief.industry.trim()) return '請輸入產業類型。'
  if (!brief.brandName.trim()) return '請輸入品牌／網站名稱。'
  if (brief.advantages.some((item) => !item.trim())) return '請完整填寫三個優點或優勢。'
  return ''
}

export async function generateBusiness(brief: BrandBrief, onProgress?: (finishedImages: number) => void): Promise<ImportResult> {
  const validationError = validateBrief(brief)
  if (validationError) throw new GenerationError(validationError, 'INVALID_BRIEF')

  const content = await apiPost<GeneratedContent>('/api/generate-content', brief)
  if (content.photoPrompts.length !== 8 || content.photoAlts.length !== 8) {
    throw new GenerationError('AI 沒有產出完整的 8 張品牌影像規劃，請再試一次。', 'INCOMPLETE_IMAGE_PLAN')
  }
  onProgress?.(0)

  const photos: BusinessPhoto[] = new Array(8)
  let cursor = 0
  let finished = 0
  async function generateNext() {
    while (cursor < content.photoPrompts.length) {
      const index = cursor++
      const image = await apiPost<{ dataUrl: string }>('/api/generate-image', {
        prompt: content.photoPrompts[index],
        brandName: brief.brandName,
        industry: brief.industry,
        index,
      })
      photos[index] = {
        id: `generated-photo-${index + 1}`,
        url: image.dataUrl,
        alt: content.photoAlts[index],
        selected: index < 5,
        source: 'ai_generated',
      }
      finished += 1
      onProgress?.(finished)
    }
  }
  await Promise.all([generateNext(), generateNext()])

  const now = Date.now()
  const draft: BusinessDraft = {
    source: 'ai_generated',
    name: brief.brandName.trim(),
    category: brief.industry.trim(),
    tagline: content.tagline,
    description: content.description,
    address: '',
    phone: '',
    googleMapsUrl: '',
    lineUrl: '',
    instagramUrl: '',
    videoUrl: '',
    services: content.services.slice(0, 3),
    hours: parseHours(brief.hours),
    photos,
    reviews: [],
    template: 'editorial',
    accent: '#B85D3F',
    regenerationCount: 0,
    createdAt: now,
    expiresAt: now + 48 * 60 * 60 * 1000,
  }
  return { mode: 'generated', draft }
}
