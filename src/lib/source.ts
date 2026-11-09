import { createIndustryPhotos } from '../data/industryPhotos'
import type { BrandBrief, BusinessDraft, BusinessHours, ImportResult } from '../types'

const API_BASE_URL = (import.meta.env.VITE_GENERATION_API_BASE_URL || '').replace(/\/$/u, '')
const DAY = 24 * 60 * 60 * 1000

type GeneratedContent = {
  tagline: string
  description: string
  advantages: [string, string, string]
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
  if (!brief.industry.trim()) return '請選擇產業類型。'
  if (!brief.brandName.trim()) return '請輸入品牌／店家名稱。'
  if (brief.advantages.some((item) => !item.trim())) return '請完整填寫三個優點或優勢。'
  if (!brief.offerings[0].trim()) return '請至少填寫一項主要服務或商品。'
  return ''
}

export async function generateBusiness(brief: BrandBrief): Promise<ImportResult> {
  const validationError = validateBrief(brief)
  if (validationError) throw new GenerationError(validationError, 'INVALID_BRIEF')

  const content = await apiPost<GeneratedContent>('/api/generate-content', brief)
  if (!Array.isArray(content.advantages) || content.advantages.length !== 3) {
    throw new GenerationError('AI 沒有產出完整的品牌優勢文案，請再試一次。', 'INCOMPLETE_CONTENT')
  }

  const now = Date.now()
  const draft: BusinessDraft = {
    source: 'generated',
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
    services: content.advantages,
    offerings: brief.offerings.map((item) => item.trim()).filter(Boolean),
    hours: parseHours(brief.hours),
    photos: createIndustryPhotos(brief.industry.trim(), brief.offerings),
    reviews: [],
    template: 'editorial',
    accent: '#B85D3F',
    regenerationCount: 0,
    createdAt: now,
    expiresAt: now + 7 * DAY,
  }
  return { mode: 'generated', draft }
}
