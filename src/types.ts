export type TemplateId = 'editorial' | 'vivid' | 'calm' | 'compact' | 'mosaic'

export type BusinessPhoto = {
  id: string
  role: 'hero' | 'people' | 'service' | 'space' | 'detail'
  url: string
  alt: string
  selected: boolean
  source?: 'library' | 'merchant' | 'stock' | 'demo'
  sourceUrl?: string
  authorName?: string
  authorUrl?: string
  authorAvatarUrl?: string
  reportUrl?: string
}

export type BusinessReview = {
  id: string
  author: string
  rating: number
  text: string
  relativeTime: string
  selected: boolean
  source?: 'merchant' | 'demo'
  sourceUrl?: string
  authorUrl?: string
  authorAvatarUrl?: string
  reportUrl?: string
}

export type BusinessHours = {
  label: string
  value: string
}

export type BusinessDraft = {
  sourceUrl?: string
  source?: 'generated' | 'merchant' | 'demo'
  name: string
  category: string
  tagline: string
  description: string
  address: string
  phone: string
  googleMapsUrl: string
  lineUrl: string
  instagramUrl: string
  videoUrl: string
  services: string[]
  offerings: string[]
  hours: BusinessHours[]
  photos: BusinessPhoto[]
  reviews: BusinessReview[]
  template: TemplateId
  accent: string
  regenerationCount: number
  createdAt: number
  expiresAt: number
  brandCheckout?: {
    handoffId: string
    slug: string
    checkoutUrl: string
    previewUrl: string
    createdAt: number
  }
}

export type ImportResult = {
  draft: BusinessDraft
  mode: 'demo' | 'generated'
}

export type BrandBrief = {
  industry: string
  brandName: string
  advantages: [string, string, string]
  offerings: [string, string, string]
  hours?: string
}

export type AppStage = 'landing' | 'importing' | 'studio' | 'launch'
export type PreviewViewport = 'desktop' | 'mobile'
