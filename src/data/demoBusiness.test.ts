import { describe, expect, it } from 'vitest'
import { campaignPhotoPackCount, createCampaignPhotos, createDemoBusiness } from './demoBusiness'

describe('demo campaign photo packs', () => {
  it('provides 16 distinct photo combinations', () => {
    expect(campaignPhotoPackCount).toBe(16)
    const signatures = Array.from({ length: campaignPhotoPackCount }, (_, index) =>
      createCampaignPhotos(index).map((photo) => photo.url).join('|'),
    )
    expect(new Set(signatures).size).toBe(campaignPhotoPackCount)
  })

  it('offers one five-photo campaign pack with fixed roles', () => {
    const draft = createDemoBusiness(1_000, 7)
    expect(draft.photos).toHaveLength(5)
    expect(draft.photos.filter((photo) => photo.selected)).toHaveLength(5)
    expect(draft.photos.map((photo) => photo.role)).toEqual(['hero', 'people', 'service', 'space', 'detail'])
    expect(draft.photos.every((photo) => photo.url.includes('/demo/generic/'))).toBe(true)
  })

  it('wraps explicit pack indexes safely', () => {
    expect(createCampaignPhotos(16)).toEqual(createCampaignPhotos(0))
    expect(createCampaignPhotos(-1)).toEqual(createCampaignPhotos(15))
  })
})
