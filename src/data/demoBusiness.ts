import type { BusinessDraft, BusinessPhoto } from '../types'

const HOUR = 60 * 60 * 1000
const demoAsset = (filename: string) => `${import.meta.env.BASE_URL}demo/${filename}`

const genericCampaignPhotos = [
  ['generic/owner-welcome.jpg', '店主在明亮門面迎接來訪顧客'],
  ['generic/owner-working.jpg', '店主在自然光工作空間整理陳列'],
  ['generic/customer-consultation.jpg', '店主與顧客在櫃台親切討論需求'],
  ['generic/hands-packaging.jpg', '店主用心完成包裝與服務細節'],
  ['generic/interior-daylight.jpg', '採光明亮且溫暖舒適的店內空間'],
  ['generic/storefront-dusk.jpg', '夜晚亮起暖光的街邊店面'],
  ['generic/team-portrait.jpg', '一起經營店家的專業團隊'],
  ['generic/customer-browse.jpg', '顧客在店內自在瀏覽與體驗'],
  ['generic/owner-tablet.jpg', '店主在營業前確認當日服務內容'],
  ['generic/customer-lounge.jpg', '顧客在舒適空間中放鬆停留'],
] as const

const campaignPhotoPacks = [
  [0, 7, 3, 4, 5], [1, 8, 2, 4, 6], [2, 9, 3, 5, 4], [3, 0, 7, 6, 4],
  [4, 8, 2, 3, 5], [5, 6, 9, 3, 4], [6, 0, 8, 4, 5], [0, 2, 9, 3, 6],
  [1, 7, 3, 5, 4], [2, 8, 6, 4, 3], [3, 9, 0, 5, 4], [4, 7, 1, 3, 6],
  [5, 8, 2, 6, 3], [6, 9, 1, 4, 5], [0, 8, 6, 3, 7], [1, 9, 2, 5, 3],
] as const

export const campaignPhotoPackCount = campaignPhotoPacks.length

export function createCampaignPhotos(photoPackIndex = Math.floor(Math.random() * campaignPhotoPackCount)): BusinessPhoto[] {
  const pack = campaignPhotoPacks[((photoPackIndex % campaignPhotoPackCount) + campaignPhotoPackCount) % campaignPhotoPackCount]
  const selectedPhotoIndexes = new Set<number>(pack)
  const remaining = genericCampaignPhotos.map((_, index) => index).filter((photoIndex) => !selectedPhotoIndexes.has(photoIndex))
  return [...pack, ...remaining.slice(0, 3)].map((photoIndex, index) => {
    const [filename, alt] = genericCampaignPhotos[photoIndex]
    return { id: `campaign-photo-${photoIndex}`, url: demoAsset(filename), alt, selected: index < pack.length, source: 'demo' }
  })
}

export function createDemoBusiness(now = Date.now(), photoPackIndex?: number): BusinessDraft {
  return {
    sourceUrl: 'demo://sunny-walk-cafe',
    source: 'demo',
    name: '日光散步珈琲',
    category: '咖啡廳・甜點店',
    tagline: '把午後留給一杯好咖啡',
    description:
      '藏在城市轉角的日常咖啡館。選用當季豆款、每日手作甜點，留一個舒服的位置，讓你慢慢喝、好好聊。',
    address: '台北市大安區溫州街 24 號',
    phone: '02 2368 2488',
    googleMapsUrl: 'https://maps.google.com/?q=日光散步珈琲',
    lineUrl: 'https://line.me/R/ti/p/@demo',
    instagramUrl: 'https://www.instagram.com/',
    videoUrl: '',
    services: ['自家烘焙咖啡', '每日手作甜點', '季節限定飲品'],
    hours: [
      { label: '週一至週五', value: '11:00–20:00' },
      { label: '週六、週日', value: '10:00–21:00' },
    ],
    photos: createCampaignPhotos(photoPackIndex),
    reviews: [],
    template: 'editorial',
    accent: '#B85D3F',
    regenerationCount: 0,
    createdAt: now,
    expiresAt: now + 48 * HOUR,
  }
}
