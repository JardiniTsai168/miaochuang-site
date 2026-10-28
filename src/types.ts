export type TemplateId = 'editorial' | 'vivid' | 'calm' | 'compact' | 'mosaic'

export type BusinessPhoto = {
  id: string
  url: string
  alt: string
  selected: boolean
  source?: 'google_places' | 'merchant' | 'demo'
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
  source?: 'google_places' | 'merchant' | 'demo'
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
  sourceUrl: string
  source?: 'google_places' | 'merchant' | 'demo'
  googlePlaceId?: string
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
  hours: BusinessHours[]
  photos: BusinessPhoto[]
  reviews: BusinessReview[]
  template: TemplateId
  accent: string
  regenerationCount: number
  createdAt: number
  expiresAt: number
}

export type ImportResult = {
  draft: BusinessDraft
  mode: 'demo' | 'live'
}

export type AppStage = 'landing' | 'importing' | 'studio' | 'ready'
export type PreviewViewport = 'desktop' | 'mobile'
