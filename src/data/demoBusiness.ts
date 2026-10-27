import type { BusinessDraft } from '../types'

const HOUR = 60 * 60 * 1000
const demoAsset = (filename: string) => `${import.meta.env.BASE_URL}demo/${filename}`

export function createDemoBusiness(now = Date.now()): BusinessDraft {
  return {
    sourceUrl: 'https://maps.app.goo.gl/demo-lihi-cafe',
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
    photos: [
      {
        id: 'photo-1',
        url: demoAsset('cafe-barista-campaign.jpg'),
        alt: '咖啡師在木質吧台沖煮手沖咖啡',
        selected: true,
      },
      {
        id: 'photo-2',
        url: demoAsset('cafe-customer-editorial.jpg'),
        alt: '顧客在雨天窗邊閱讀與喝咖啡',
        selected: true,
      },
      {
        id: 'photo-3',
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
        alt: '手沖咖啡',
        selected: true,
      },
      {
        id: 'photo-4',
        url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=85',
        alt: '每日手作甜點',
        selected: true,
      },
      {
        id: 'photo-5',
        url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=85',
        alt: '咖啡館窗邊座位',
        selected: true,
      },
      {
        id: 'photo-6',
        url: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&q=85',
        alt: '拿鐵與咖啡豆',
        selected: false,
      },
    ],
    reviews: [
      {
        id: 'review-1',
        author: 'Wei Lin',
        rating: 5,
        text: '空間很舒服，咖啡順口，甜點也不會太甜。很適合帶電腦來坐一個下午。',
        relativeTime: '2 個月前',
        selected: true,
      },
      {
        id: 'review-2',
        author: 'Mia Chen',
        rating: 5,
        text: '店員很親切，會依照喜歡的風味推薦豆子。窗邊自然光很漂亮。',
        relativeTime: '3 個月前',
        selected: true,
      },
      {
        id: 'review-3',
        author: 'Jason Wu',
        rating: 4,
        text: '巷弄裡安靜的小店，巴斯克很好吃，假日建議早點來。',
        relativeTime: '5 個月前',
        selected: true,
      },
    ],
    template: 'editorial',
    accent: '#B85D3F',
    regenerationCount: 0,
    createdAt: now,
    expiresAt: now + 48 * HOUR,
  }
}
