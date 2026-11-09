import type { BusinessPhoto } from '../types'

type PhotoPack = {
  query: string
  urls: string[]
}

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=82`

const packs: Record<string, PhotoPack> = {
  hair: {
    query: 'hair-salon',
    urls: [
      image('photo-1634449571010-02389ed0f9b0'),
      image('photo-1580618672591-eb180b1a973f'),
      image('photo-1605497788044-5a32c7078486'),
      image('photo-1560869713-7d0a29430803'),
      image('photo-1595475884562-073c30d45670'),
      image('photo-1600948836101-f9ffda59d250'),
    ],
  },
  beauty: {
    query: 'nail-salon',
    urls: [
      image('photo-1632345031435-8727f6897d53'),
      image('photo-1604654894610-df63bc536371'),
      image('photo-1610992015762-45dca7fa3a85'),
      image('photo-1690749138086-7422f71dc159'),
      image('photo-1599206676335-193c82b13c9e'),
      image('photo-1516975080664-ed2fc6a32937'),
    ],
  },
  spa: {
    query: 'massage-spa',
    urls: [
      image('photo-1600334089648-b0d9d3028eb2'),
      image('photo-1515377905703-c4788e51af15'),
      image('photo-1519823551278-64ac92734fb1'),
      image('photo-1540555700478-4be289fbecef'),
      image('photo-1600334129128-685c5582fd35'),
      image('photo-1544161515-4ab6ce6db874'),
    ],
  },
  fitness: {
    query: 'fitness-trainer',
    urls: [
      image('photo-1581009146145-b5ef050c2e1e'),
      image('photo-1548690312-e3b507d8c110'),
      image('photo-1648542036561-e1d66a5ae2b1'),
      image('photo-1594381898411-846e7d193883'),
      image('photo-1571019613454-1cb2f99b2d8b'),
      image('photo-1518611012118-696072aa579a'),
    ],
  },
  creative: {
    query: 'photography-studio',
    urls: [
      image('photo-1471341971476-ae15ff5dd4ea'),
      image('photo-1617463874381-85b513b3e991'),
      image('photo-1554941829-202a0b2403b8'),
      image('photo-1664817550969-5e76adc4a3fe'),
      image('photo-1452780212940-6f5c0d14d848'),
      image('photo-1492619375914-88005aa9e8fb'),
    ],
  },
  cleaning: {
    query: 'home-cleaning',
    urls: [
      image('photo-1740657254989-42fe9c3b8cce'),
      image('photo-1686178827149-6d55c72d81df'),
      image('photo-1563453392212-326f5e854473'),
      image('photo-1585421514284-efb74c2b69ba'),
      image('photo-1527515637462-cff94eecc1ac'),
      image('photo-1581578731548-c64695cc6952'),
    ],
  },
  service: {
    query: 'small-business-owner',
    urls: [
      image('photo-1531058240690-006c446962d8'),
      image('photo-1556740758-90de374c12ad'),
      image('photo-1545262722-9e0d80a0bc01'),
      image('photo-1520333789090-1afc82db536a'),
      image('photo-1556742049-0cfed4f6a45d'),
      image('photo-1556740749-887f6717d7e4'),
    ],
  },
}

const roles: BusinessPhoto['role'][] = ['hero', 'people', 'service', 'space', 'detail']
const roleLabels = ['品牌主視覺', '服務互動情境', '主要服務', '服務空間', '專業細節']

function packKey(industry: string): keyof typeof packs {
  if (industry.includes('美髮')) return 'hair'
  if (/美容|美甲|美睫/u.test(industry)) return 'beauty'
  if (/按摩|SPA/u.test(industry)) return 'spa'
  if (/健身|瑜伽|教練/u.test(industry)) return 'fitness'
  if (/攝影|設計|工作室/u.test(industry)) return 'creative'
  if (/清潔|維修/u.test(industry)) return 'cleaning'
  return 'service'
}

function hash(value: string): number {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 0)
}

export function createIndustryPhotos(industry: string, offerings: string[]): BusinessPhoto[] {
  const pack = packs[packKey(industry)]
  const serviceNames = offerings.map((item) => item.trim()).filter(Boolean)
  const offset = hash(`${industry}|${serviceNames.join('|')}`) % pack.urls.length
  const sourceUrl = `https://unsplash.com/s/photos/${pack.query}`

  return roles.map((role, index) => {
    const service = serviceNames[index % Math.max(serviceNames.length, 1)]
    return {
      id: `industry-${packKey(industry)}-${index}`,
      role,
      url: pack.urls[(offset + index) % pack.urls.length],
      alt: `${industry}${service ? `「${service}」` : ''}${roleLabels[index]}形象照`,
      selected: true,
      source: 'stock',
      sourceUrl,
    }
  })
}
