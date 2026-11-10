// Generated shape for the initial seed. EmDash refreshes this file after startup.
/// <reference types="emdash/locals" />

import type { BylineSummary, ContentBylineCredit, TaxonomyTerm } from 'emdash'

export interface Site {
  id: string
  slug: string | null
  status: string
  name: string
  template: 'editorial' | 'vivid' | 'calm' | 'compact' | 'mosaic'
  template_key?: 'marketing' | 'portfolio' | 'blog' | 'starter'
  palette_key?: 'hair' | 'beauty' | 'spa' | 'fitness' | 'creative' | 'cleaning' | 'food' | 'service' | 'coral' | 'plum' | 'ochre' | 'midnight'
  html: string
  category: string
  logo_url?: string
  tagline: string
  description: string
  address?: string
  phone?: string
  google_maps_url?: string
  line_url?: string
  instagram_url?: string
  video_url?: string
  service_1?: string
  service_2?: string
  service_3?: string
  offering_1: string
  offering_2?: string
  offering_3?: string
  hours?: string
  photo_1_url?: string
  photo_1_alt?: string
  photo_2_url?: string
  photo_2_alt?: string
  photo_3_url?: string
  photo_3_alt?: string
  photo_4_url?: string
  photo_4_alt?: string
  photo_5_url?: string
  photo_5_alt?: string
  expires_at: Date
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  byline?: BylineSummary | null
  bylines?: ContentBylineCredit[]
  terms?: Record<string, TaxonomyTerm[]>
}

declare module 'emdash' {
  interface EmDashCollections {
    sites: Site
  }
}
