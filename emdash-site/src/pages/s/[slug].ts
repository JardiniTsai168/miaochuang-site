import { decodeSlug, getEmDashEntry } from 'emdash'
import type { APIRoute } from 'astro'
import { renderSite } from '../../../../src/lib/renderSite'
import type { BusinessDraft, BusinessHours, BusinessPhoto, TemplateId } from '../../../../src/types'
import type { Site } from '../../../emdash-env'

const legacyTemplates: Record<Site['template'], TemplateId> = {
  editorial: 'blog',
  vivid: 'marketing',
  calm: 'starter',
  compact: 'starter',
  mosaic: 'portfolio',
}

function toDraft(data: Site): BusinessDraft {
  const hours: BusinessHours[] = (data.hours || '')
    .split('\n')
    .map((line: string) => {
      const [label = '', ...value] = line.split('｜')
      return { label: label.trim(), value: value.join('｜').trim() }
    })
    .filter((item: BusinessHours) => item.label || item.value)
  const photoRoles: BusinessPhoto['role'][] = ['hero', 'people', 'service', 'space', 'detail']
  const photos: BusinessPhoto[] = photoRoles
    .map((role, index) => {
      const position = index + 1
      const url = String(data[`photo_${position}_url` as keyof typeof data] || '')
      const alt = String(data[`photo_${position}_alt` as keyof typeof data] || '')
      return {
        id: `emdash-photo-${position}`,
        role,
        url,
        alt,
        selected: Boolean(url),
        source: 'merchant' as const,
      }
    })
    .filter((photo) => photo.url)

  return {
    source: 'merchant',
    name: data.name,
    category: data.category,
    tagline: data.tagline,
    description: data.description,
    address: data.address || '',
    phone: data.phone || '',
    googleMapsUrl: data.google_maps_url || '',
    lineUrl: data.line_url || '',
    instagramUrl: data.instagram_url || '',
    videoUrl: data.video_url || '',
    services: [data.service_1, data.service_2, data.service_3].filter(Boolean) as string[],
    offerings: [data.offering_1, data.offering_2, data.offering_3].filter(Boolean) as string[],
    hours,
    photos,
    reviews: [],
    template: data.template_key || legacyTemplates[data.template],
    paletteKey: data.palette_key,
    accent: '#171717',
    regenerationCount: 0,
    createdAt: new Date(data.createdAt).getTime(),
    expiresAt: new Date(data.expires_at).getTime(),
  }
}

export const GET: APIRoute = async ({ params }) => {
  const slug = decodeSlug(params.slug)
  if (!slug) return new Response('Not found', { status: 404 })

  const { entry } = await getEmDashEntry('sites', slug)
  if (!entry) return new Response('Not found', { status: 404 })

  const expiresAt = new Date(entry.data.expires_at).getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return new Response('這個網站預覽已到期。', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    })
  }

  const hasStructuredContent = Boolean(entry.data.template_key && entry.data.category && entry.data.tagline && entry.data.description && entry.data.offering_1)
  const html = hasStructuredContent ? renderSite(toDraft(entry.data), { noindex: true }) : entry.data.html

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}
