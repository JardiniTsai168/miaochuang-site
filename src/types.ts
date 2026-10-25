export type TemplateId = 'editorial' | 'vivid' | 'calm'

export type BusinessPhoto = {
  id: string
  url: string
  alt: string
  selected: boolean
}

export type BusinessReview = {
  id: string
  author: string
  rating: number
  text: string
  relativeTime: string
  selected: boolean
}

export type BusinessHours = {
  label: string
  value: string
}

export type BusinessDraft = {
  sourceUrl: string
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
