import type { BusinessDraft, TemplateId } from '../types'

const templateNames: Record<TemplateId, string> = {
  editorial: '編輯誌',
  vivid: '醒目海報',
  calm: '靜謐藝廊',
  compact: '手作菜單',
  mosaic: '影像拼貼',
}

export { templateNames }

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeUrl(value: string, fallback = '#'): string {
  if (/^\/(?!\/)/.test(value)) return escapeHtml(value)
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'tel:'].includes(url.protocol) ? escapeHtml(url.toString()) : fallback
  } catch {
    return fallback
  }
}

function phoneUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

type IndustryIdentity = {
  id: 'cafe' | 'dining' | 'beauty' | 'wellness' | 'local'
  label: string
  detail: string
  icon: string
}

function industryIdentity(category: string): IndustryIdentity {
  const normalized = category.toLowerCase()
  if (/(咖啡|珈琲|甜點|烘焙|茶|cafe|coffee)/.test(normalized)) {
    return {
      id: 'cafe',
      label: 'COFFEE CULTURE',
      detail: 'CAFÉ & DESSERT',
      icon: '<svg viewBox="0 0 40 40" role="img" aria-label="咖啡杯插圖"><path d="M8 14h20v8a9 9 0 0 1-9 9h-2a9 9 0 0 1-9-9v-8Z"/><path d="M28 17h3a4 4 0 0 1 0 8h-4"/><path d="M13 9c0-2 2-2 2-4m6 4c0-2 2-2 2-4"/></svg>',
    }
  }
  if (/(餐|食|拉麵|火鍋|早餐|小吃|料理|酒館|restaurant|food)/.test(normalized)) {
    return {
      id: 'dining',
      label: 'LOCAL TABLE',
      detail: 'FOOD & DRINK',
      icon: '<svg viewBox="0 0 40 40" role="img" aria-label="餐碗插圖"><path d="M7 18h26a13 13 0 0 1-26 0Z"/><path d="M12 32h16M13 12c2-3 5-4 8-4m3 4c1-2 3-3 5-3"/><path d="M5 16h30"/></svg>',
    }
  }
  if (/(髮|美容|美甲|美睫|保養|spa|按摩|造型|beauty|salon)/.test(normalized)) {
    return {
      id: 'beauty',
      label: 'PERSONAL CARE',
      detail: 'BEAUTY & STYLE',
      icon: '<svg viewBox="0 0 40 40" role="img" aria-label="花瓣插圖"><circle cx="20" cy="20" r="4"/><path d="M20 16C12 13 12 6 17 5c4-1 6 4 3 11Zm4 4c3-8 10-8 12-3 1 4-4 6-12 3Zm-4 4c8 3 8 10 3 12-4 1-6-4-3-12Zm-4-4c-3 8-10 8-12 3-1-4 4-6 12-3Z"/></svg>',
    }
  }
  if (/(健身|瑜珈|運動|體能|舞蹈|fitness|gym|yoga)/.test(normalized)) {
    return {
      id: 'wellness',
      label: 'MOVE & BALANCE',
      detail: 'FITNESS & WELLNESS',
      icon: '<svg viewBox="0 0 40 40" role="img" aria-label="運動啞鈴插圖"><path d="M4 17v6m5-10v14m5-9h12m0-5v14m5-10v6M9 20H4m27 0h5"/></svg>',
    }
  }
  return {
    id: 'local',
    label: 'LOCAL BUSINESS',
    detail: 'MADE FOR THE NEIGHBORHOOD',
    icon: '<svg viewBox="0 0 40 40" role="img" aria-label="店面插圖"><path d="M7 16v18h26V16M5 16h30l-3-9H8l-3 9Z"/><path d="M10 16c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0M17 34V24h7v10"/></svg>',
  }
}

function youtubeEmbed(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${escapeHtml(url.pathname.slice(1))}`
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${escapeHtml(id)}` : null
    }
    return null
  } catch {
    return null
  }
}

function sharedSections(draft: BusinessDraft) {
  const photos = draft.photos.filter((photo) => photo.selected).slice(0, 12)
  const reviews = draft.reviews.filter((review) => review.selected).slice(0, 5)
  const hero = photos[0]
  const youtube = youtubeEmbed(draft.videoUrl)
  const accent = /^#[0-9a-f]{6}$/i.test(draft.accent) ? draft.accent : '#b85d3f'

  const services = draft.services.filter(Boolean)
  const hours = draft.hours.filter((item) => item.label || item.value)
  const gallery = photos.slice(1)

  return {
    accent,
    hero,
    gallery,
    services,
    hours,
    reviews,
    youtube,
    serviceHtml: services.length
      ? `<section class="section services" id="services"><div class="section-heading"><p>WHAT WE OFFER</p><h2>我們準備好的日常</h2></div><div class="service-list">${services
          .map((service, index) => `<article><span>0${index + 1}</span><h3>${escapeHtml(service)}</h3></article>`)
          .join('')}</div></section>`
      : '',
    galleryHtml: gallery.length
      ? `<section class="section gallery" id="gallery"><div class="section-heading"><p>SPACE & MOMENTS</p><h2>從照片，先認識我們</h2></div><div class="gallery-grid">${gallery
          .map(
            (photo) =>
              `<figure><img src="${safeUrl(photo.url)}" alt="${escapeHtml(photo.alt)}" loading="lazy"><figcaption>${escapeHtml(photo.alt)}</figcaption></figure>`,
          )
          .join('')}</div></section>`
      : '',
    reviewHtml: reviews.length
      ? `<section class="section reviews" id="reviews"><div class="section-heading"><p>GOOGLE REVIEWS</p><h2>來訪的人這樣說</h2></div><div class="review-list">${reviews
          .map(
            (review) =>
              `<blockquote><div class="stars" aria-label="${review.rating} 顆星">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div><p>「${escapeHtml(review.text)}」</p><footer><strong>${escapeHtml(review.author)}</strong><span>${escapeHtml(review.relativeTime)}・Google 評論</span></footer></blockquote>`,
          )
          .join('')}</div></section>`
      : '',
    videoHtml: draft.videoUrl
      ? `<section class="section video"><div class="section-heading"><p>SHORT FILM</p><h2>用一支影片認識我們</h2></div>${
          youtube
            ? `<div class="video-frame"><iframe src="${youtube}" title="${escapeHtml(draft.name)}短影音" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
            : `<a class="video-link" href="${safeUrl(draft.videoUrl)}" target="_blank" rel="noopener noreferrer">觀看店家短影音 <span aria-hidden="true">↗</span></a>`
        }</section>`
      : '',
    contactLinks: [
      draft.phone ? `<a href="${phoneUrl(draft.phone)}">電話聯絡</a>` : '',
      draft.lineUrl ? `<a href="${safeUrl(draft.lineUrl)}" target="_blank" rel="noopener noreferrer">加入 LINE</a>` : '',
      draft.instagramUrl ? `<a href="${safeUrl(draft.instagramUrl)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : '',
      draft.googleMapsUrl ? `<a href="${safeUrl(draft.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">Google 地圖</a>` : '',
    ]
      .filter(Boolean)
      .join(''),
  }
}

function baseStyles(template: TemplateId, accent: string): string {
  const variant = {
    editorial: {
      body: '#f6f0e8',
      surface: '#fffaf3',
      ink: '#2f2925',
      muted: '#746a62',
      display: '"Noto Serif TC", serif',
      radius: '2px',
      max: '1180px',
    },
    vivid: {
      body: '#fff7f0',
      surface: '#fffdf8',
      ink: '#172147',
      muted: '#59617b',
      display: '"Noto Sans TC", sans-serif',
      radius: '24px',
      max: '1240px',
    },
    calm: {
      body: '#f5f7f3',
      surface: '#fbfcf8',
      ink: '#243028',
      muted: '#647168',
      display: '"Noto Serif TC", serif',
      radius: '0px',
      max: '1080px',
    },
    compact: {
      body: '#f3f1ea',
      surface: '#fffdf7',
      ink: '#17363d',
      muted: '#66787b',
      display: '"Noto Sans TC", sans-serif',
      radius: '4px',
      max: '1120px',
    },
    mosaic: {
      body: '#f3edf1',
      surface: '#fffafd',
      ink: '#352531',
      muted: '#786a74',
      display: '"Noto Serif TC", serif',
      radius: '0px',
      max: '1160px',
    },
  }[template]

  return `
    :root{--accent:${accent};--body:${variant.body};--surface:${variant.surface};--ink:${variant.ink};--muted:${variant.muted};--line:color-mix(in srgb,var(--ink) 14%,transparent);--display:${variant.display};--sans:"Noto Sans TC",sans-serif;--radius:${variant.radius};--max:${variant.max}}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--body);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.75}a{color:inherit}img{display:block;width:100%}button,a{-webkit-tap-highlight-color:transparent}.skip{position:fixed;left:16px;top:-80px;z-index:20;padding:10px 16px;background:var(--ink);color:var(--surface)}.skip:focus{top:16px}.site-nav{position:absolute;inset:0 0 auto;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(calc(100% - 32px),var(--max));margin:auto;padding:22px 0;color:#fff}.site-nav strong{font-family:var(--display);font-size:1.1rem;letter-spacing:.04em}.site-nav div{display:flex;gap:20px}.site-nav a{text-decoration:none;font-size:.875rem;font-weight:700}.hero{position:relative;min-height:min(620px,74vh);display:grid;align-items:end;overflow:hidden;background:var(--ink)}.hero-media{position:absolute;inset:0}.hero-media img{height:100%;object-fit:cover}.hero-media img:not(:first-child){display:none}.hero-media:after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,16,24,.12),rgba(14,16,24,.82));content:""}.hero-content{position:relative;z-index:2;width:min(calc(100% - 32px),var(--max));margin:0 auto;padding:118px 0 50px;color:#fff}.kicker,.section-heading>p{margin:0 0 12px;font-size:.72rem;font-weight:800;letter-spacing:.18em}.hero h1{max-width:11ch;margin:0;font-family:var(--display);font-size:clamp(3rem,7vw,6rem);line-height:1.02;letter-spacing:-.055em}.hero .tagline{max-width:32ch;margin:18px 0 0;font-size:clamp(1rem,2vw,1.3rem);line-height:1.6}.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.button{min-height:46px;padding:0 20px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.7);border-radius:var(--radius);text-decoration:none;font-size:.9rem;font-weight:800}.button.primary{border-color:var(--accent);background:var(--accent);color:#fff}.industry-art{position:absolute;z-index:3;display:flex;align-items:center;gap:12px;pointer-events:none}.industry-art svg,.identity-icon svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.industry-art p{margin:0;line-height:1.15}.industry-art strong,.industry-art small{display:block}.industry-art strong{font-size:.65rem;letter-spacing:.16em}.industry-art small{margin-top:5px;font-size:.55rem;letter-spacing:.1em}.hero-index{position:absolute;z-index:2;font-family:var(--display);line-height:1;pointer-events:none}.identity-strip{position:relative;z-index:4;display:grid;grid-template-columns:auto minmax(160px,.6fr) 1fr;align-items:center;gap:18px;width:min(calc(100% - 32px),var(--max));margin:0 auto;padding:16px 0;border-bottom:1px solid var(--line)}.identity-icon{width:44px;height:44px;color:var(--accent)}.identity-label{display:flex;flex-direction:column;line-height:1.2}.identity-label span{font-size:.62rem;font-weight:800;letter-spacing:.16em;color:var(--accent)}.identity-label strong{margin-top:5px;font-family:var(--display);font-size:1rem}.identity-services{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}.identity-services span{padding:5px 10px;border:1px solid var(--line);font-size:.72rem;font-weight:700}.section{width:min(calc(100% - 32px),var(--max));margin:0 auto;padding:clamp(64px,8vw,108px) 0;border-bottom:1px solid var(--line)}.section-heading{display:grid;grid-template-columns:minmax(120px,.35fr) 1fr;gap:32px;align-items:start;margin-bottom:40px}.section-heading>p{color:var(--accent)}.section h2{max-width:15ch;margin:0;font-family:var(--display);font-size:clamp(2rem,4.5vw,4rem);line-height:1.15;letter-spacing:-.045em}.about-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(40px,7vw,96px);align-items:start}.about-copy{margin:0;font-family:var(--display);font-size:clamp(1.35rem,2.4vw,2rem);line-height:1.55}.facts{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}.facts li{display:grid;grid-template-columns:110px 1fr;gap:20px;padding:18px 0;border-bottom:1px solid var(--line)}.facts span{color:var(--muted);font-size:.82rem}.facts strong{font-weight:600}.service-list{border-top:1px solid var(--line)}.service-list article{display:grid;grid-template-columns:70px 1fr;gap:24px;align-items:center;padding:24px 0;border-bottom:1px solid var(--line)}.service-list span{color:var(--accent);font-size:.78rem;font-weight:800}.service-list h3{margin:0;font-family:var(--display);font-size:clamp(1.35rem,2.7vw,2.2rem);font-weight:600}.gallery-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}.gallery-grid figure{grid-column:span 6;margin:0}.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid img{aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.gallery-grid figure:nth-child(3n) img{aspect-ratio:2/1}.gallery-grid figcaption{margin-top:8px;color:var(--muted);font-size:.75rem}.review-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0;border-top:1px solid var(--line)}blockquote{margin:0;padding:28px 28px 28px 0;border-bottom:1px solid var(--line)}blockquote+blockquote{padding-left:28px;border-left:1px solid var(--line)}.stars{color:var(--accent);letter-spacing:.08em}blockquote>p{min-height:6em;margin:18px 0;font-family:var(--display);font-size:1.15rem;line-height:1.7}blockquote footer{display:flex;flex-direction:column;gap:2px}blockquote footer span{color:var(--muted);font-size:.75rem}.video-frame{position:relative;overflow:hidden;aspect-ratio:16/9;border-radius:var(--radius);background:var(--ink)}.video-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.video-link{min-height:100px;display:flex;align-items:center;justify-content:space-between;padding:28px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);text-decoration:none;font-family:var(--display);font-size:clamp(1.3rem,3vw,2.2rem)}.contact{padding-bottom:64px}.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}.contact-links{display:flex;flex-direction:column;border-top:1px solid var(--line)}.contact-links a{padding:18px 0;border-bottom:1px solid var(--line);text-decoration:none;font-weight:700}.map-address{font-family:var(--display);font-size:clamp(1.4rem,3vw,2.4rem);line-height:1.45}.site-footer{display:flex;justify-content:space-between;gap:24px;width:min(calc(100% - 32px),var(--max));margin:auto;padding:28px 0 42px;color:var(--muted);font-size:.75rem}.site-footer a{text-decoration:none}.powered{font-weight:800;color:var(--ink)}
    a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
    @media(min-width:760px){.site-nav{padding-top:32px}.site-nav a:hover{opacity:.7}.button{transition:transform .18s cubic-bezier(.25,1,.5,1)}.button:hover{transform:translateY(-2px)}}
    @media(max-width:759px){.site-nav{padding-top:18px}.site-nav div a:not(:last-child){display:none}.hero{min-height:520px}.hero-content{padding:104px 0 36px}.hero h1{font-size:clamp(2.7rem,13vw,4.2rem)}.hero .tagline{margin-top:14px}.hero-actions{margin-top:20px}.industry-art{display:none}.identity-strip{grid-template-columns:auto 1fr;gap:12px;padding:13px 0}.identity-icon{width:36px;height:36px}.identity-services{grid-column:1/-1;justify-content:flex-start}.identity-services span{font-size:.68rem}.section-heading,.about-grid,.contact-grid{grid-template-columns:1fr}.section-heading{gap:8px;margin-bottom:28px}.section-heading>p{margin-bottom:4px}.facts{margin-top:8px}.gallery-grid{gap:10px}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}blockquote+blockquote{padding-left:0;border-left:0}.site-footer{flex-direction:column}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition-duration:.01ms!important}}
  `
}

function variantStyles(template: TemplateId): string {
  if (template === 'vivid') {
    return `.hero{min-height:580px;background:#172147}.hero:before{position:absolute;inset:0 auto 0 0;z-index:1;width:42%;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.035) 20px 22px);content:""}.hero-media{left:42%;clip-path:polygon(14% 0,100% 0,100% 100%,0 100%)}.hero-media:after{background:linear-gradient(90deg,#172147 0,rgba(23,33,71,.82) 10%,rgba(23,33,71,.06) 76%)}.hero h1{max-width:none;white-space:nowrap;font-family:var(--sans);font-weight:900;line-height:.92;letter-spacing:-.07em;text-shadow:5px 5px 0 var(--accent)}.kicker{display:inline-flex;padding:6px 11px;border-radius:999px;background:#f0c94c;color:#172147}.industry-art{right:max(18px,calc((100% - var(--max))/2));bottom:18px;padding:10px 14px;background:#f0c94c;color:#172147;transform:rotate(-2deg)}.industry-art>span{width:40px;height:40px}.hero-index{right:3%;top:4%;color:rgba(255,255,255,.12);font-family:var(--sans);font-size:8rem;font-weight:900}.identity-strip{width:100%;max-width:none;padding:13px max(16px,calc((100% - var(--max))/2));border:0;background:#f0c94c;color:#172147}.identity-strip .identity-icon{color:#172147}.identity-strip .identity-label span{color:#172147}.identity-services span{border:2px solid #172147;border-radius:999px}.section{border:0}.section-heading{grid-template-columns:150px 1fr;align-items:end}.section-heading h2{font-family:var(--sans);font-weight:900}.about{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#f0c94c;color:#172147}.about .section-heading>p{color:#172147}.about-copy{font-family:var(--sans);font-weight:800}.services{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#172147;color:#fffdf8}.services .service-list{display:grid;grid-template-columns:1fr 1fr}.services .service-list article:nth-child(odd){border-right:1px solid rgba(255,255,255,.25)}.gallery-grid figure{position:relative}.gallery-grid figure:after{position:absolute;inset:10px -10px -10px 10px;z-index:-1;border-radius:24px;background:var(--accent);content:""}.gallery-grid img{border-radius:24px}.review-list{gap:18px;border:0}.review-list blockquote{padding:28px;border:2px solid #172147;border-radius:22px;box-shadow:6px 6px 0 #172147}.contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--accent);color:#fff}@media(max-width:759px){.hero{min-height:500px}.hero:before{width:100%}.hero-media{left:0;clip-path:none}.hero-media:after{background:linear-gradient(180deg,rgba(23,33,71,.02),#172147)}.hero h1{text-shadow:3px 3px 0 var(--accent)}.hero-index{font-size:5rem}.identity-strip{padding-inline:16px}.section-heading{grid-template-columns:1fr}.services .service-list{grid-template-columns:1fr}.services .service-list article:nth-child(odd){border-right:0}}`
  }
  if (template === 'calm') {
    return `.site-nav{position:relative;color:var(--ink)}.hero{min-height:auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(28px,5vw,72px);padding:16px max(16px,calc((100% - var(--max))/2)) 38px;background:var(--body)}.hero-media{position:relative;grid-column:2;min-height:500px;overflow:hidden}.hero-media:before{position:absolute;inset:12px;z-index:1;border:1px solid rgba(255,255,255,.72);content:""}.hero-media:after{display:none}.hero-media img{filter:saturate(.65) contrast(.94)}.hero-content{grid-column:1;grid-row:1;width:auto;padding:84px 0 48px;color:var(--ink)}.hero h1{font-size:clamp(2.8rem,5vw,5rem);font-weight:600}.hero .tagline{position:relative;padding-left:48px}.hero .tagline:before{position:absolute;left:0;top:.85em;width:30px;height:1px;background:var(--accent);content:""}.industry-art{right:max(30px,calc((100% - var(--max))/2 + 16px));top:42px;flex-direction:column;width:82px;padding:14px 9px;background:rgba(251,252,248,.9);color:var(--ink);text-align:center}.industry-art>span{width:42px;height:42px;color:var(--accent)}.hero-index{left:calc(50% - 28px);bottom:24px;color:color-mix(in srgb,var(--accent) 22%,transparent);font-size:6rem}.identity-strip:after{height:1px;flex:1;background:var(--accent);content:""}.identity-services{display:none}.button{border-color:var(--ink)}.section-heading{grid-template-columns:180px 1fr}.section-heading>p:before{display:inline-block;width:26px;height:1px;margin:0 10px 3px 0;background:var(--accent);content:""}.gallery-grid{gap:12px}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 4}.gallery-grid figure:nth-child(2){margin-top:52px}.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}.gallery-grid figcaption{display:none}.reviews blockquote{position:relative;padding-left:52px}.reviews blockquote:before{position:absolute;left:0;top:14px;color:var(--accent);font-family:var(--display);font-size:3rem;content:"“"}@media(max-width:759px){.site-nav{position:relative;color:var(--ink)}.hero{grid-template-columns:1fr;padding:0 16px 24px;gap:18px}.hero-media{grid-column:1;grid-row:1;min-height:260px}.hero-content{grid-column:1;grid-row:2;padding:0;color:var(--ink)}.hero h1{font-size:clamp(2.5rem,12vw,3.7rem)}.hero-index{display:none}.identity-strip:after{display:none}.button{border-color:var(--ink)}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid figure:nth-child(2){margin-top:0}}`
  }
  if (template === 'compact') {
    return `.site-nav{position:relative;color:var(--ink);border-bottom:1px solid var(--line)}.hero{min-height:auto;display:grid;grid-template-columns:1.12fr .88fr;width:min(calc(100% - 32px),var(--max));margin:24px auto 0;background:var(--surface);border:1px solid var(--ink);box-shadow:10px 10px 0 color-mix(in srgb,var(--accent) 20%,transparent)}.hero-media{position:relative;grid-column:2;min-height:410px;border-left:1px solid var(--ink)}.hero-media:after{position:absolute;inset:auto 12px 12px auto;width:54px;height:54px;border:1px solid rgba(255,255,255,.8);background:transparent;content:""}.hero-content{grid-column:1;grid-row:1;width:auto;padding:56px;color:var(--ink)}.hero h1{font-family:var(--sans);font-size:clamp(2.7rem,4.5vw,4.4rem);font-weight:900}.hero .tagline{max-width:25ch}.industry-art{right:18px;top:18px;padding:9px;background:var(--surface);color:var(--ink);border:1px solid var(--ink)}.industry-art>span{width:34px;height:34px}.industry-art p{display:none}.hero-index{left:18px;top:14px;color:color-mix(in srgb,var(--ink) 12%,transparent);font-family:var(--sans);font-size:4rem;font-weight:900}.identity-strip{margin-top:22px;padding:12px 16px;border:1px solid var(--ink);background:var(--surface)}.identity-icon{width:36px;height:36px}.identity-services span{border-color:var(--ink)}.button{border-color:var(--ink)}.section{padding-block:56px}.section-heading{grid-template-columns:150px 1fr}.section h2{font-size:clamp(1.8rem,3vw,2.8rem)}.about-grid{gap:48px}.service-list{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--ink)}.service-list article{display:block;padding:24px;border:0;border-right:1px solid var(--ink)}.service-list article:last-child{border-right:0}.service-list span{display:block;margin-bottom:20px}.service-list h3{font-family:var(--sans);font-size:1.2rem}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 6}.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}.gallery-grid figure{position:relative;padding:8px;border:1px solid var(--line);background:var(--surface)}@media(max-width:759px){.hero{grid-template-columns:1fr;margin-top:16px;box-shadow:6px 6px 0 color-mix(in srgb,var(--accent) 20%,transparent)}.hero-media{grid-column:1;grid-row:1;min-height:220px;border-left:0;border-bottom:1px solid var(--ink)}.hero-content{grid-column:1;grid-row:2;padding:28px 22px}.hero h1{font-size:2.6rem}.identity-strip{margin-top:14px}.service-list{grid-template-columns:1fr}.service-list article{border-right:0;border-bottom:1px solid var(--ink)}.service-list article:last-child{border-bottom:0}.section-heading{grid-template-columns:1fr}}`
  }
  if (template === 'mosaic') {
    return `.site-nav{position:relative;color:var(--ink)}.hero{min-height:auto;display:grid;grid-template-columns:.74fr 1.26fr;gap:28px;width:min(calc(100% - 32px),var(--max));margin:20px auto 0;background:transparent;overflow:visible}.hero-media{position:relative;grid-column:2;min-height:500px;display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:1fr 1fr;gap:10px}.hero-media:before{position:absolute;z-index:2;left:45%;top:-11px;width:72px;height:22px;background:rgba(236,221,194,.84);transform:rotate(-4deg);content:""}.hero-media img,.hero-media img:not(:first-child){display:block;height:100%;min-height:0;object-fit:cover;border:7px solid var(--surface);box-shadow:0 10px 24px rgba(53,37,49,.12)}.hero-media img:first-child{grid-row:1/3;transform:rotate(-1deg)}.hero-media img:nth-child(2){transform:rotate(1.5deg)}.hero-media img:nth-child(3){transform:rotate(-1deg)}.hero-media:after{display:none}.hero-content{grid-column:1;grid-row:1;width:auto;align-self:end;padding:40px 10px 36px 0;color:var(--ink)}.hero h1{font-size:clamp(2.8rem,5vw,5rem);font-weight:600}.industry-art{right:-14px;bottom:-18px;width:106px;height:106px;justify-content:center;border-radius:50%;background:var(--accent);color:#fff;transform:rotate(8deg)}.industry-art>span{width:48px;height:48px}.industry-art p{display:none}.hero-index{left:0;top:18px;color:color-mix(in srgb,var(--accent) 14%,transparent);font-size:7rem}.identity-strip{margin-top:30px;padding:12px 18px;background:var(--surface);border:1px solid var(--line);transform:rotate(-.35deg)}.button{border-color:var(--ink)}.section-heading{grid-template-columns:150px 1fr}.gallery-grid{gap:14px}.gallery-grid figure{grid-column:span 4;transform:rotate(-.6deg)}.gallery-grid figure:nth-child(even){transform:rotate(.8deg)}.gallery-grid figure:nth-child(3n){grid-column:span 8}.gallery-grid figure:nth-child(4n){grid-column:span 4}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:1/1;border:7px solid var(--surface);box-shadow:0 8px 20px rgba(53,37,49,.1)}.review-list{gap:14px}.review-list blockquote{background:var(--surface);padding:28px;transform:rotate(-.3deg)}.review-list blockquote:nth-child(even){transform:rotate(.4deg)}.contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--accent);color:#fff}@media(max-width:759px){.hero{grid-template-columns:1fr;margin-top:12px;gap:16px}.hero-media{grid-column:1;grid-row:1;min-height:300px}.hero-content{grid-column:1;grid-row:2;padding:8px 0 24px;color:var(--ink)}.hero h1{font-size:2.8rem}.hero-index{display:none}.identity-strip{margin-top:16px;transform:none}.gallery-grid figure,.gallery-grid figure:nth-child(3n),.gallery-grid figure:nth-child(4n){grid-column:span 12}.section-heading{grid-template-columns:1fr}}`
  }
  return `.site-nav{mix-blend-mode:difference}.hero{min-height:min(590px,72vh)}.hero:before{position:absolute;z-index:2;left:max(16px,calc((100% - var(--max))/2));top:92px;width:44px;height:1px;background:#fff;box-shadow:54px 0 0 rgba(255,255,255,.45);content:""}.hero-content{padding-left:clamp(0px,4vw,56px)}.hero h1{font-weight:600}.industry-art{right:max(18px,calc((100% - var(--max))/2));bottom:20px;padding:12px 15px;border:1px solid rgba(255,255,255,.65);color:#fff;background:rgba(47,41,37,.42)}.industry-art>span{width:46px;height:46px}.hero-index{right:max(20px,calc((100% - var(--max))/2));top:76px;color:rgba(255,255,255,.22);font-size:5.5rem}.identity-strip{padding-top:18px;padding-bottom:18px}.identity-strip:before{position:absolute;left:0;top:-5px;width:62px;height:10px;background:var(--accent);content:""}.section{position:relative}.section:before{position:absolute;right:0;top:30px;color:color-mix(in srgb,var(--ink) 18%,transparent);font-family:var(--display);font-size:clamp(3rem,7vw,6rem);line-height:1}.about:before{content:"01"}.services:before{content:"02"}.gallery:before{content:"03"}.reviews:before{content:"04"}.contact:before{content:"05"}.section-heading>p{display:flex;align-items:center;gap:10px}.section-heading>p:after{width:36px;height:1px;background:var(--accent);content:""}.about-grid{grid-template-columns:1.35fr .65fr}.about-copy:first-letter{float:left;margin:.11em .12em 0 0;color:var(--accent);font-size:4.2em;line-height:.7}.service-list article{transition:padding-left .2s ease}.gallery-grid{gap:20px}.gallery-grid figure:nth-child(odd){grid-column:span 7}.gallery-grid figure:nth-child(even){grid-column:8/span 5;margin-top:48px}.gallery-grid figure:nth-child(3n){grid-column:span 12;margin-top:0}.gallery-grid figure{position:relative}.gallery-grid figure:before{position:absolute;z-index:1;left:-8px;top:-8px;width:36px;height:36px;border-left:2px solid var(--accent);border-top:2px solid var(--accent);content:""}.contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--ink);color:var(--surface)}@media(min-width:760px){.service-list article:hover{padding-left:14px}}@media(max-width:759px){.site-nav{mix-blend-mode:normal}.hero{min-height:500px}.hero-content{padding-left:0}.hero-index{font-size:4rem}.identity-strip:before{left:0}.section:before{top:34px;font-size:3rem}.about-grid{grid-template-columns:1fr}.gallery-grid figure:nth-child(odd),.gallery-grid figure:nth-child(even),.gallery-grid figure:nth-child(3n){grid-column:span 12;margin-top:0}}`
}

function heroSizingStyles(template: TemplateId): string {
  if (template === 'vivid') {
    return `.hero{min-height:320px;align-items:center}.hero-content{padding-top:52px;padding-bottom:4px}.hero h1{font-size:var(--title-size);max-width:none;white-space:nowrap}@media(max-width:759px){.hero{min-height:320px}.hero-content{padding-top:50px;padding-bottom:4px}.hero h1{font-size:var(--title-size);max-width:none;white-space:nowrap}}`
  }
  if (template === 'editorial') {
    return `.hero{min-height:320px;align-items:center}.hero-content{padding-top:52px;padding-bottom:4px}.hero h1{font-size:clamp(2.4rem,5vw,3.6rem)}@media(max-width:759px){.hero{min-height:320px}.hero-content{padding-top:50px;padding-bottom:4px}.hero h1{font-size:clamp(2.2rem,9.5vw,2.7rem)}}`
  }
  if (template === 'calm') {
    return `.hero-media{min-height:260px}.hero-content{padding-top:28px;padding-bottom:18px}@media(max-width:759px){.hero-media{min-height:130px}.hero-content{padding-top:0;padding-bottom:14px}}`
  }
  if (template === 'compact') {
    return `.hero-media{min-height:220px}.hero-content{padding:26px}@media(max-width:759px){.hero-media{min-height:120px}.hero-content{padding:18px}}`
  }
  return `.hero-media{height:380px;min-height:0}.hero-content{padding-top:14px;padding-bottom:16px}@media(max-width:759px){.hero-media{height:240px;min-height:0}.hero-content{padding-top:0;padding-bottom:12px}}`
}

function campaignImageStyles(template: TemplateId): string {
  if (template === 'vivid') {
    return `.hero-media img:first-child{object-position:58% 42%}.hero-media img:nth-child(2){display:block;position:absolute;z-index:3;right:18px;bottom:18px;width:92px;height:116px;border:4px solid #f0c94c;object-fit:cover;object-position:50% 24%;transform:rotate(2deg)}.industry-art{right:124px}@media(max-width:759px){.hero-media img:nth-child(2){display:none}.industry-art{right:18px}}`
  }
  if (template === 'calm') {
    return `.hero-media img:first-child{object-position:56% 42%}.hero-media img:nth-child(2){display:block;position:absolute;z-index:2;left:18px;bottom:18px;width:92px;height:112px;border:6px solid var(--surface);object-fit:cover;object-position:50% 22%;box-shadow:0 12px 28px rgba(36,48,40,.18)}@media(max-width:759px){.hero-media img:nth-child(2){display:none}}`
  }
  if (template === 'compact') {
    return `.hero-media img:first-child{object-position:58% 42%}.hero-media img:nth-child(2){display:block;position:absolute;z-index:2;left:-42px;bottom:14px;width:84px;height:106px;border:5px solid var(--surface);object-fit:cover;object-position:50% 22%;box-shadow:0 10px 24px rgba(23,54,61,.2)}@media(max-width:759px){.hero-media img:nth-child(2){display:none}}`
  }
  if (template === 'mosaic') {
    return `.hero-media img:first-child{object-position:58% 42%}.hero-media img:nth-child(2){object-position:50% 22%}`
  }
  return `.hero-media img:first-child{object-position:58% 42%}.hero-media img:nth-child(2){display:block;position:absolute;z-index:2;right:max(18px,calc((100% - var(--max))/2));bottom:18px;width:104px;height:130px;border:5px solid var(--surface);object-fit:cover;object-position:50% 22%;transform:rotate(1.5deg);box-shadow:0 10px 28px rgba(47,41,37,.24)}.industry-art{right:max(142px,calc((100% - var(--max))/2 + 124px))}@media(max-width:759px){.hero-media img:nth-child(2){display:none}.industry-art{right:18px}}`
}

function professionalTemplateStyles(template: TemplateId): string {
  const shared = `
    .hero h1{font-size:clamp(40px,4.4vw,64px)}
    .template-intro{width:min(calc(100% - 32px),var(--max));margin:0 auto;padding:18px 0;border-bottom:1px solid var(--line);font-size:.66rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
    @media(max-width:759px){.hero h1{font-size:clamp(32px,10vw,44px)}.template-intro{font-size:.58rem}}
  `

  if (template === 'editorial') {
    return `${shared}
      .site-nav{position:relative;color:var(--ink)}
      .hero{min-height:320px;width:min(calc(100% - 32px),var(--max));margin:0 auto 24px;display:block;overflow:visible;background:transparent}
      .hero-media{position:relative;width:72%;height:286px;margin-left:auto;overflow:hidden}
      .hero-media:after{background:linear-gradient(90deg,rgba(28,23,20,.12),rgba(28,23,20,0) 55%)}
      .hero-content{position:absolute;left:0;bottom:0;width:48%;padding:26px 30px;background:var(--surface);color:var(--ink);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)}
      .hero h1{max-width:10ch;line-height:1.08}
      .hero .tagline{margin-top:10px;font-size:1rem}.hero-actions{margin-top:14px}.button{min-height:42px;border-color:var(--ink)}
      .hero-index{left:0;top:0;color:var(--accent);font-size:3.2rem}.industry-art{right:12px;bottom:12px}
      .template-intro{display:flex;justify-content:space-between}.template-intro:after{content:"VOL. 01 / TAIWAN"}
      .section-heading h2{font-weight:500}.gallery{padding-top:46px}.gallery-grid figure:nth-child(1){grid-column:span 8}.gallery-grid figure:nth-child(2){grid-column:9/span 4;margin-top:72px}
      @media(max-width:759px){.hero{min-height:420px}.hero-media{width:100%;height:248px}.hero-content{left:12px;right:12px;bottom:0;width:auto;padding:18px}.hero h1{max-width:12ch}.hero-index,.industry-art{display:none}.template-intro:after{content:"VOL. 01"}}
    `
  }
  if (template === 'vivid') {
    return `${shared}
      .hero{min-height:320px}.hero-media{left:46%;clip-path:polygon(12% 0,100% 0,100% 100%,0 100%)}.hero-content{width:min(calc(100% - 32px),var(--max));padding:52px 0 20px}
      .hero h1{max-width:9ch;white-space:normal;text-transform:uppercase;line-height:.92}.hero .tagline{max-width:22ch}
      .template-intro{width:100%;max-width:none;padding:12px max(16px,calc((100% - var(--max))/2));background:#f0c94c;color:#172147;border:0;white-space:nowrap;overflow:hidden}.template-intro:after{content:" ✦ OPEN TODAY ✦ GOOD THINGS HAPPEN HERE ✦"}
      .services{padding-top:52px}.services .service-list article{min-height:120px}.about{border-top:10px solid var(--accent)}
      @media(max-width:759px){.hero{min-height:390px}.hero-content{padding:64px 0 28px}.hero h1{max-width:8ch;white-space:normal}.template-intro{font-size:.6rem}}
    `
  }
  if (template === 'calm') {
    return `${shared}
      .hero{min-height:320px;grid-template-columns:.72fr 1.28fr;padding-top:8px;padding-bottom:20px}.hero-media{min-height:292px}.hero-content{padding:42px 0 24px}.hero h1{max-width:7ch;font-weight:500}.hero .tagline{max-width:20ch}
      .template-intro{width:min(calc(100% - 32px),var(--max));display:grid;grid-template-columns:180px 1fr;color:var(--muted)}.template-intro:after{content:"QUIET SPACE · HONEST CRAFT · LOCAL STORY"}
      .about{padding-top:56px}.about .section-heading{margin-bottom:64px}.gallery-grid img{filter:saturate(.72)}
      @media(max-width:759px){.hero{min-height:auto;grid-template-columns:1fr}.hero-media{min-height:208px}.hero h1{max-width:12ch}.template-intro{grid-template-columns:1fr;gap:4px}.template-intro:after{content:"QUIET SPACE · LOCAL STORY"}}
    `
  }
  if (template === 'compact') {
    return `${shared}
      .hero{min-height:306px;grid-template-columns:1.38fr .62fr;margin-top:18px;box-shadow:8px 8px 0 var(--accent)}.hero-media{min-height:304px}.hero-content{padding:34px}.hero h1{max-width:9ch;line-height:1}.hero .tagline{max-width:24ch;font-size:1rem}
      .template-intro{display:grid;grid-template-columns:repeat(3,1fr);padding:0;border:1px solid var(--ink);border-top:0}.template-intro span{padding:12px 14px;border-right:1px solid var(--ink)}.template-intro span:last-child{border-right:0}.template-intro span:nth-child(2):after{content:"TODAY'S SELECTION"}.template-intro span:nth-child(3):after{content:"WALK-INS WELCOME"}
      .contact.visit-first{padding-top:44px;padding-bottom:44px}.contact.visit-first .section-heading{margin-bottom:24px}.services{padding-top:48px}.service-list h3{font-family:var(--sans);font-weight:800}
      @media(max-width:759px){.hero{grid-template-columns:1fr;min-height:auto}.hero-media{min-height:158px}.hero-content{padding:22px}.hero h1{max-width:12ch}.template-intro{grid-template-columns:1fr}.template-intro span{border-right:0;border-bottom:1px solid var(--ink)}.template-intro span:last-child{border-bottom:0}}
    `
  }
  return `${shared}
    .hero{min-height:420px;grid-template-columns:.62fr 1.38fr}.hero-media{height:400px}.hero-content{align-self:center;padding:20px 12px 20px 0}.hero h1{max-width:7ch;line-height:1.05}.hero .tagline{max-width:20ch}
    .template-intro{border:0;text-align:center}.template-intro:before{content:"01";display:inline-grid;place-items:center;width:34px;height:34px;margin-right:12px;border-radius:50%;background:var(--accent);color:#fff}.template-intro:after{content:"STORIES / PEOPLE / PLACE"}
    .gallery{padding-top:34px}.gallery .section-heading{display:none}.gallery-grid{grid-template-columns:repeat(12,1fr);align-items:start}.gallery-grid figure:nth-child(1){grid-column:1/span 7}.gallery-grid figure:nth-child(2){grid-column:8/span 5;margin-top:54px}.gallery-grid figure:nth-child(3){grid-column:2/span 4}.gallery-grid figure:nth-child(4){grid-column:6/span 7;margin-top:-24px}
    @media(max-width:759px){.hero{min-height:auto;grid-template-columns:1fr}.hero-media{height:258px}.hero-content{padding:8px 0 20px}.hero h1{max-width:11ch}.template-intro{display:flex;align-items:center;justify-content:center}.gallery-grid figure:nth-child(n){grid-column:span 12;margin-top:0}}
  `
}

function completeArtDirectionStyles(template: TemplateId): string {
  const common = `
    .site-footer{align-items:flex-end}.footer-name{display:block;font-family:var(--display);line-height:.9}.site-footer>div{display:flex;gap:24px;align-items:center}
    .section h2{font-size:clamp(32px,3.3vw,48px)}
    @media(max-width:759px){.section h2{font-size:clamp(28px,8vw,36px)}.site-footer{align-items:flex-start}.site-footer>div{width:100%;justify-content:space-between}}
  `

  if (template === 'editorial') {
    return `${common}
      :root{--display:"Cormorant Garamond","Noto Serif TC",serif}
      body{background:#eee7dc}.site-nav{border-bottom:1px solid var(--ink)}.site-nav strong{font-size:1.35rem;font-weight:700;text-transform:uppercase}.site-nav a{font-family:"DM Sans",sans-serif;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}
      .section{padding-block:74px}.section-heading{grid-template-columns:110px 1fr;margin-bottom:54px}.section-heading>p{font-family:"DM Sans",sans-serif}.section-heading h2{max-width:12ch;font-weight:500}
      .about-copy{font-size:clamp(1.65rem,3vw,2.7rem);line-height:1.38}.facts li{grid-template-columns:88px 1fr}.facts span{font-family:"DM Sans",sans-serif;text-transform:uppercase;letter-spacing:.08em}
      .service-list article{grid-template-columns:90px 1fr;padding:28px 0}.service-list span{font-family:"DM Sans",sans-serif}.service-list h3{font-size:clamp(1.7rem,3vw,2.8rem);font-weight:500}
      .gallery-grid figcaption{font-family:"DM Sans",sans-serif;letter-spacing:.04em}.reviews{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--ink);color:#eee7dc}.reviews .section-heading>p,.reviews .stars{color:#d47a57}.reviews .review-list{border-color:rgba(255,255,255,.25)}.reviews blockquote{border-color:rgba(255,255,255,.25)}.reviews blockquote>p{font-size:clamp(1.35rem,2.2vw,2rem);line-height:1.5}.reviews blockquote footer span{color:#bdb4aa}
      .contact{padding-top:72px}.contact-links a{font-family:"DM Sans",sans-serif;text-transform:uppercase;letter-spacing:.08em}
      .site-footer{width:100%;max-width:none;padding:46px max(16px,calc((100% - var(--max))/2));background:var(--ink);color:#eee7dc}.footer-name{font-size:clamp(2.6rem,6vw,5rem)}.site-footer .powered{color:#eee7dc}
      @media(max-width:759px){.section-heading{grid-template-columns:1fr;margin-bottom:32px}.reviews blockquote>p{min-height:0}.footer-name{font-size:2.5rem}.site-footer>div{flex-direction:column;align-items:flex-start;gap:6px}}
    `
  }
  if (template === 'vivid') {
    return `${common}
      :root{--display:"Archivo Black","Noto Sans TC",sans-serif}.site-nav strong{font-family:var(--display);text-transform:uppercase}.site-nav a{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em}
      .section{padding-block:66px}.section h2,.about-copy,.service-list h3{font-family:var(--display);letter-spacing:-.04em}.section-heading{grid-template-columns:130px 1fr}.section-heading>p{font-family:"DM Sans",sans-serif}
      .services .service-list article{padding:28px}.services .service-list h3{font-size:clamp(1.6rem,3vw,2.6rem)}
      .gallery{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#fff0e5}.gallery-grid{gap:22px}.gallery-grid figure{grid-column:span 7}.gallery-grid figure:nth-child(even){grid-column:8/span 5;margin-top:52px}.gallery-grid figure:nth-child(3n){grid-column:2/span 10}.gallery-grid img{border:3px solid #172147;border-radius:0;box-shadow:9px 9px 0 var(--accent)}
      .reviews{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#f0c94c;color:#172147}.reviews .section-heading>p,.reviews .stars{color:#172147}.review-list{grid-template-columns:repeat(3,1fr);gap:14px;border:0}.review-list blockquote{padding:26px;border:3px solid #172147;background:#fff7f0;box-shadow:7px 7px 0 #172147}.review-list blockquote+blockquote{padding-left:26px}.review-list blockquote:nth-child(2){background:var(--accent);color:#fff}.review-list blockquote:nth-child(2) .stars{color:#fff}.review-list blockquote>p{min-height:8em;font-family:"Noto Sans TC",sans-serif;font-weight:800}
      .contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--accent);color:#fff}.contact .section-heading>p{color:#fff}.contact-links{border-color:#fff}.contact-links a{border-color:rgba(255,255,255,.45)}
      .site-footer{width:100%;max-width:none;padding:34px max(16px,calc((100% - var(--max))/2));background:#172147;color:#fff}.footer-name{max-width:9ch;font-size:clamp(2.6rem,5vw,4.6rem);text-transform:uppercase}.site-footer .powered{color:#f0c94c}
      @media(max-width:759px){.section-heading{grid-template-columns:1fr}.gallery-grid figure,.gallery-grid figure:nth-child(even),.gallery-grid figure:nth-child(3n){grid-column:span 12;margin-top:0}.gallery-grid img{box-shadow:5px 5px 0 var(--accent)}.review-list{grid-template-columns:1fr}.review-list blockquote>p{min-height:0}.footer-name{font-size:2.4rem}}
    `
  }
  if (template === 'calm') {
    return `${common}
      :root{--display:"Noto Serif TC",serif}.site-nav{padding-bottom:18px}.site-nav strong{font-size:1.2rem;font-weight:500}.site-nav a{font-size:.72rem;font-weight:500;letter-spacing:.08em}
      .hero{min-height:356px;display:flex;flex-direction:column;padding:0 16px 24px;gap:20px;overflow:visible}.hero-content{order:1;width:min(100%,760px);padding:28px 0 4px;text-align:center}.hero h1{max-width:none}.hero .tagline{max-width:none;padding-left:0}.hero .tagline:before{display:none}.hero-actions{justify-content:center}.hero-media{order:2;grid-column:auto;width:min(100%,1080px);height:220px;min-height:0;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#e9ede7}.hero-media img,.hero-media img:not(:first-child){position:static;display:block;width:100%;height:100%;min-height:0;object-fit:contain;filter:saturate(.65) contrast(.94);background:#e9ede7}.hero-media:after{display:none}.hero-index{left:max(16px,calc((100% - 1080px)/2));bottom:12px}.industry-art{display:none}
      .section{padding-block:88px}.section-heading{grid-template-columns:190px 1fr;margin-bottom:62px}.section-heading h2{font-weight:500;line-height:1.3}.about-copy{font-size:clamp(1.5rem,2.5vw,2.25rem);font-weight:500}.facts{border-color:#8f9d92}.facts li{padding:21px 0}
      .services .service-list{display:grid;grid-template-columns:repeat(3,1fr);border-top:0}.services .service-list article{display:block;padding:28px 28px 48px;border-top:1px solid var(--line);border-bottom:0}.services .service-list span{display:block;margin-bottom:42px}.services .service-list h3{font-size:1.35rem}
      .gallery{width:min(calc(100% - 64px),1260px)}.gallery-grid{gap:30px}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 4}.gallery-grid figure:nth-child(2){margin-top:86px}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:3/4;filter:saturate(.55)}
      .reviews{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#e9ede7}.reviews .section-heading{margin-bottom:34px}.review-list{display:block;max-width:820px;margin-left:auto;border:0}.review-list blockquote{padding:34px 0;border-left:0}.review-list blockquote>p{min-height:0;margin:14px 0;font-size:clamp(1.2rem,2vw,1.65rem)}.review-list blockquote footer{align-items:flex-end}
      .contact{background:var(--surface);padding-inline:32px}.site-footer{border-top:1px solid var(--line)}.footer-name{font-size:clamp(2.4rem,4vw,3.8rem);font-weight:500}.site-footer .powered{font-weight:500}
      @media(max-width:759px){.hero{min-height:auto;display:flex;padding-bottom:18px}.hero-content{order:1;padding:18px 0 0}.hero-media{order:2;width:100%;height:150px;min-height:0;gap:5px}.hero h1{max-width:none}.section-heading{grid-template-columns:1fr;margin-bottom:28px}.services .service-list{grid-template-columns:1fr}.services .service-list article{padding:24px 0}.services .service-list span{margin-bottom:18px}.gallery{width:calc(100% - 32px)}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid figure:nth-child(2){margin-top:0}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}.contact{padding-inline:16px}}
    `
  }
  if (template === 'compact') {
    return `${common}
      :root{--display:"Barlow Condensed","Noto Sans TC",sans-serif}body{background-color:#f3f1ea;background-image:linear-gradient(rgba(23,54,61,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(23,54,61,.045) 1px,transparent 1px);background-size:24px 24px}.site-nav{background:#f3f1ea}.site-nav strong{font-family:var(--display);font-size:1.5rem;font-weight:800;text-transform:uppercase}.site-nav a{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em}
      .hero{grid-template-columns:1fr 1fr;min-height:278px}.hero-content{grid-column:1;grid-row:1;padding:32px}.hero-media{grid-column:2;grid-row:1;min-height:276px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr;gap:1px;background:var(--ink)}.hero-media img,.hero-media img:not(:first-child){position:static;display:block;width:100%;height:100%;min-height:0;border:0;box-shadow:none;transform:none;object-fit:contain;background:#dfe4e1}.hero-media img:first-child{grid-row:auto}.hero-media:after{display:none}.industry-art{display:none}.hero-index{left:20px;top:18px}.hero:after{position:absolute;left:32px;bottom:18px;color:var(--muted);font-family:var(--display);font-size:.72rem;letter-spacing:.12em;content:"EST. LOCAL / OPEN DAILY"}
      .section{margin-top:24px;padding:32px;border:1px solid var(--ink);background:#fffdf7}.section-heading{grid-template-columns:110px 1fr;margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid var(--ink)}.section-heading>p{font-family:var(--display);font-size:.82rem}.section h2{font-family:"Noto Sans TC",sans-serif;font-size:clamp(28px,2.6vw,38px);font-weight:900}
      .contact.visit-first{padding:32px}.contact-grid{grid-template-columns:1.2fr .8fr}.map-address{font-family:"Noto Sans TC",sans-serif;font-size:clamp(1.35rem,2.5vw,2rem);font-weight:900}
      .service-list{border:1px solid var(--ink)}.service-list article{grid-template-columns:70px 1fr;padding:18px 20px}.service-list span{font-family:var(--display);font-size:1rem}.service-list h3{font-size:1.1rem}.gallery-grid{gap:8px}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 3;padding:4px;border:1px solid var(--ink)}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:1/1}.gallery-grid figcaption{display:none}
      .review-list{display:block;border:1px solid var(--ink)}.review-list blockquote{display:grid;grid-template-columns:100px 1fr 140px;align-items:center;gap:20px;padding:18px 20px;border:0;border-bottom:1px solid var(--ink)}.review-list blockquote:last-child{border-bottom:0}.review-list blockquote+blockquote{padding-left:20px;border-left:0}.review-list blockquote>p{min-height:0;margin:0;font-family:"Noto Sans TC",sans-serif;font-size:.95rem}.review-list blockquote footer{font-size:.72rem}
      .site-footer{margin-top:24px;padding:32px;border:1px solid var(--ink);background:#17363d;color:#fffdf7}.footer-name{font-family:"Barlow Condensed","Noto Sans TC",sans-serif;font-size:clamp(2.8rem,5vw,4.8rem);font-weight:800;text-transform:uppercase}.site-footer .powered{color:#fffdf7}
      @media(max-width:759px){.hero{grid-template-columns:1fr;min-height:auto}.hero-media{grid-column:1;grid-row:1;height:150px;min-height:0}.hero-content{grid-column:1;grid-row:2;padding:20px}.hero:after{display:none}.section{padding:22px}.section-heading{grid-template-columns:1fr}.contact-grid{grid-template-columns:1fr}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 6}.review-list blockquote{grid-template-columns:1fr;gap:8px}.footer-name{font-size:2.6rem}}
    `
  }
  return `${common}
    :root{--display:"Cormorant Garamond","Noto Serif TC",serif}body{background:#eee7ee}.site-nav{background:#eee7ee}.site-nav strong{font-size:1.35rem}.site-nav a{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em}
    .hero{width:100%;max-width:none;margin:0;padding:28px max(16px,calc((100% - var(--max))/2));grid-template-columns:.62fr 1.38fr;background:#241b23;color:#fff;overflow:hidden}.hero-content{color:#fff}.hero h1{color:#fff}.hero .kicker{color:#d9c8d5}.hero-media{height:354px}.hero-media img,.hero-media img:not(:first-child){border-color:#eee7ee;box-shadow:0 10px 30px rgba(0,0,0,.35)}.hero-index{left:max(16px,calc((100% - var(--max))/2));top:28px;color:rgba(255,255,255,.1)}.hero:after{position:absolute;left:max(16px,calc((100% - var(--max))/2));bottom:24px;color:#d9c8d5;font-family:"DM Sans",sans-serif;font-size:.6rem;letter-spacing:.18em;content:"COLLECTED MOMENTS / PEOPLE / PLACE"}.button{border-color:#fff}.button.primary{border-color:#9a4c7f;background:#9a4c7f}
    .section{border-bottom:0}.section-heading{grid-template-columns:130px 1fr}.section-heading h2{font-weight:600}.about{display:grid;grid-template-columns:.45fr 1fr;gap:48px}.about .section-heading{display:block}.about .about-grid{grid-template-columns:1fr}.about-copy{font-size:clamp(1.6rem,3vw,2.7rem)}
    .services .service-list{display:flex;flex-wrap:wrap;gap:14px;border:0}.services .service-list article{display:block;flex:1 1 220px;min-height:180px;padding:28px;border:0;background:#fffafd;box-shadow:7px 8px 0 #d9c8d5;transform:rotate(-.7deg)}.services .service-list article:nth-child(even){background:#352531;color:#fff;transform:rotate(.8deg)}.services .service-list span{display:block;margin-bottom:48px}.services .service-list h3{font-size:1.65rem}
    .reviews{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#d9c8d5}.review-list{gap:18px;border:0}.review-list blockquote{padding:28px;background:#fffafd;border:0;box-shadow:0 12px 25px rgba(53,37,49,.12);transform:rotate(-.5deg)}.review-list blockquote:nth-child(even){transform:rotate(.6deg)}.review-list blockquote+blockquote{padding-left:28px}.review-list blockquote>p{min-height:7em;font-size:1.15rem}
    .contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#6f365d;color:#fff}.contact .section-heading>p,.contact .stars{color:#fff}.contact-links{border-color:#fff}.contact-links a{border-color:rgba(255,255,255,.4)}
    .site-footer{width:100%;max-width:none;padding:42px max(16px,calc((100% - var(--max))/2));background:#352531;color:#fffafd}.footer-name{font-size:clamp(3rem,7vw,6.5rem)}.site-footer .powered{color:#fffafd}
    @media(max-width:759px){.hero{grid-template-columns:1fr;padding:16px}.hero-media{grid-column:1;grid-row:1;height:270px}.hero-content{grid-column:1;grid-row:2;color:#fff;padding:14px 0 24px}.hero h1{max-width:10ch}.hero:after{display:none}.section-heading{grid-template-columns:1fr}.about{grid-template-columns:1fr;gap:0}.services .service-list{display:grid}.services .service-list article{min-height:150px}.review-list blockquote>p{min-height:0}.footer-name{font-size:2.8rem}}
  `
}

function fixedTemplateRules(): string {
  return `
    .hero h1{max-width:none;white-space:nowrap;font-size:min(var(--title-size),64px)}
    .section{padding-block:56px}
    .template-compact .section{padding-block:32px}
    @media(max-width:759px){.hero h1{font-size:min(var(--title-size),44px)}.section{padding-block:44px}.template-compact .section{padding-block:22px}}
  `
}

export function renderSite(draft: BusinessDraft): string {
  const shared = sharedSections(draft)
  const title = `${escapeHtml(draft.name)}｜${escapeHtml(draft.category)}`
  const description = escapeHtml(draft.description)
  const heroImage = shared.hero?.url ?? ''
  const heroPhotos = [shared.hero, ...shared.gallery.slice(0, 2)].filter(Boolean)
  const identity = industryIdentity(draft.category)
  const titleLength = Math.max(Array.from(draft.name.trim()).length, 6)
  const titleSize = Math.max(16, Math.min(54, Math.floor(270 / titleLength)))
  const identityServices = shared.services
    .slice(0, 3)
    .map((service) => `<span>${escapeHtml(service)}</span>`)
    .join('')
  const facts = [
    draft.address ? `<li><span>地址</span><strong>${escapeHtml(draft.address)}</strong></li>` : '',
    draft.phone ? `<li><span>電話</span><strong>${escapeHtml(draft.phone)}</strong></li>` : '',
    ...shared.hours.map(
      (item, index) => `<li><span>${index === 0 ? '營業時間' : ''}</span><strong>${escapeHtml(item.label)}　${escapeHtml(item.value)}</strong></li>`,
    ),
  ]
    .filter(Boolean)
    .join('')

  const heroHtml = `<header class="hero">
      <div class="hero-media">${heroPhotos.map((photo) => `<img src="${safeUrl(photo!.url)}" alt="${escapeHtml(photo!.alt)}">`).join('')}</div>
      <div class="industry-art" data-industry="${identity.id}" aria-hidden="true"><span>${identity.icon}</span><p><strong>${identity.label}</strong><small>${identity.detail}</small></p></div>
      <span class="hero-index" aria-hidden="true">01</span>
      <div class="hero-content"><p class="kicker">${escapeHtml(draft.category)}</p><h1 style="--title-size:${titleSize}px">${escapeHtml(draft.name)}</h1><p class="tagline">${escapeHtml(draft.tagline)}</p><div class="hero-actions">${draft.googleMapsUrl ? `<a class="button primary" href="${safeUrl(draft.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">查看地圖</a>` : ''}${draft.phone ? `<a class="button" href="${phoneUrl(draft.phone)}">電話聯絡</a>` : ''}</div></div>
    </header>`
  const identityHtml = `<aside class="identity-strip" aria-label="店家產業與特色"><span class="identity-icon" aria-hidden="true">${identity.icon}</span><div class="identity-label"><span>${identity.label}</span><strong>${escapeHtml(draft.category)}</strong></div>${identityServices ? `<div class="identity-services">${identityServices}</div>` : ''}</aside>`
  const introHtml = `<div class="template-intro" aria-hidden="true"><span>${templateNames[draft.template]} / ${escapeHtml(draft.category)}</span><span></span><span></span></div>`
  const aboutHtml = `<section class="section about" id="about"><div class="section-heading"><p>ABOUT US</p><h2>一間店，也是一種生活的提案</h2></div><div class="about-grid"><p class="about-copy">${escapeHtml(draft.description)}</p><ul class="facts">${facts}</ul></div></section>`
  const contactHtml = `<section class="section contact${draft.template === 'compact' ? ' visit-first' : ''}" id="contact"><div class="section-heading"><p>VISIT & CONTACT</p><h2>期待與你見面</h2></div><div class="contact-grid"><div><p class="map-address">${escapeHtml(draft.address)}</p>${draft.googleMapsUrl ? `<a href="${safeUrl(draft.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">在 Google 地圖開啟 ↗</a>` : ''}</div><div class="contact-links">${shared.contactLinks}</div></div></section>`
  const templateLayouts: Record<TemplateId, string[]> = {
    editorial: [heroHtml, introHtml, identityHtml, shared.galleryHtml, aboutHtml, shared.serviceHtml, shared.reviewHtml, shared.videoHtml, contactHtml],
    vivid: [heroHtml, introHtml, shared.serviceHtml, identityHtml, shared.galleryHtml, aboutHtml, shared.videoHtml, shared.reviewHtml, contactHtml],
    calm: [heroHtml, introHtml, aboutHtml, shared.galleryHtml, shared.serviceHtml, shared.reviewHtml, contactHtml, shared.videoHtml],
    compact: [heroHtml, introHtml, contactHtml, shared.serviceHtml, aboutHtml, shared.reviewHtml, shared.galleryHtml, shared.videoHtml],
    mosaic: [heroHtml, introHtml, shared.galleryHtml, aboutHtml, shared.reviewHtml, shared.serviceHtml, shared.videoHtml, contactHtml],
  }
  const pageContent = templateLayouts[draft.template].filter(Boolean).join('')

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: draft.name,
    description: draft.description,
    address: draft.address,
    telephone: draft.phone,
    image: shared.gallery.map((photo) => photo.url),
  }

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  ${heroImage ? `<meta property="og:image" content="${safeUrl(heroImage)}">` : ''}
  <meta name="theme-color" content="${shared.accent}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Barlow+Condensed:wght@600;700;800&family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@500;600;700&family=Noto+Sans+TC:wght@400;500;600;700;800;900&family=Noto+Serif+TC:wght@500;600;700;900&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
  <style>${baseStyles(draft.template, shared.accent)}${variantStyles(draft.template)}${heroSizingStyles(draft.template)}${campaignImageStyles(draft.template)}${professionalTemplateStyles(draft.template)}${completeArtDirectionStyles(draft.template)}${fixedTemplateRules()}</style>
</head>
<body class="template-${draft.template}" data-layout="${draft.template}">
  <a class="skip" href="#main" target="_self">跳至主要內容</a>
  <nav class="site-nav" aria-label="主要導覽"><strong>${escapeHtml(draft.name)}</strong><div><a href="#about" target="_self">關於我們</a>${shared.services.length ? '<a href="#services" target="_self">服務項目</a>' : ''}${shared.gallery.length ? '<a href="#gallery" target="_self">店家照片</a>' : ''}<a href="#contact" target="_self">聯絡資訊</a></div></nav>
  <main id="main">
    ${pageContent}
  </main>
  <footer class="site-footer"><strong class="footer-name">${escapeHtml(draft.name)}</strong><div><span>© ${new Date().getFullYear()} ${escapeHtml(draft.name)}</span><a class="powered" href="https://lihidomain.com/" target="_blank" rel="noopener noreferrer">Powered by lihiDomain</a></div></footer>
</body>
</html>`
}

export function openPreview(draft: BusinessDraft): void {
  const blob = new Blob([renderSite(draft)], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
