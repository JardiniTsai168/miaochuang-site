import type { BusinessDraft, TemplateId } from '../types'

const templateNames: Record<TemplateId, string> = {
  editorial: '日常誌',
  vivid: '招牌感',
  calm: '留白所',
  compact: '店家名片',
  mosaic: '照片誌',
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
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--body);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.75}a{color:inherit}img{display:block;width:100%}button,a{-webkit-tap-highlight-color:transparent}.skip{position:fixed;left:16px;top:-80px;z-index:20;padding:10px 16px;background:var(--ink);color:var(--surface)}.skip:focus{top:16px}.site-nav{position:absolute;inset:0 0 auto;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(calc(100% - 32px),var(--max));margin:auto;padding:22px 0;color:#fff}.site-nav strong{font-family:var(--display);font-size:1.1rem;letter-spacing:.04em}.site-nav div{display:flex;gap:20px}.site-nav a{text-decoration:none;font-size:.875rem;font-weight:700}.hero{position:relative;min-height:min(620px,74vh);display:grid;align-items:end;overflow:hidden;background:var(--ink)}.hero-media{position:absolute;inset:0}.hero-media img{height:100%;object-fit:cover}.hero-media img:not(:first-child){display:none}.hero-media:after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,16,24,.12),rgba(14,16,24,.82));content:""}.hero-content{position:relative;z-index:2;width:min(calc(100% - 32px),var(--max));margin:0 auto;padding:118px 0 50px;color:#fff}.kicker,.section-heading>p{margin:0 0 12px;font-size:.72rem;font-weight:800;letter-spacing:.18em}.hero h1{max-width:11ch;margin:0;font-family:var(--display);font-size:clamp(3rem,7vw,6rem);line-height:1.02;letter-spacing:-.055em}.hero .tagline{max-width:32ch;margin:18px 0 0;font-size:clamp(1rem,2vw,1.3rem);line-height:1.6}.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.button{min-height:46px;padding:0 20px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.7);border-radius:var(--radius);text-decoration:none;font-size:.9rem;font-weight:800}.button.primary{border-color:var(--accent);background:var(--accent);color:#fff}.section{width:min(calc(100% - 32px),var(--max));margin:0 auto;padding:clamp(64px,8vw,108px) 0;border-bottom:1px solid var(--line)}.section-heading{display:grid;grid-template-columns:minmax(120px,.35fr) 1fr;gap:32px;align-items:start;margin-bottom:40px}.section-heading>p{color:var(--accent)}.section h2{max-width:15ch;margin:0;font-family:var(--display);font-size:clamp(2rem,4.5vw,4rem);line-height:1.15;letter-spacing:-.045em}.about-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(40px,7vw,96px);align-items:start}.about-copy{margin:0;font-family:var(--display);font-size:clamp(1.35rem,2.4vw,2rem);line-height:1.55}.facts{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}.facts li{display:grid;grid-template-columns:110px 1fr;gap:20px;padding:18px 0;border-bottom:1px solid var(--line)}.facts span{color:var(--muted);font-size:.82rem}.facts strong{font-weight:600}.service-list{border-top:1px solid var(--line)}.service-list article{display:grid;grid-template-columns:70px 1fr;gap:24px;align-items:center;padding:24px 0;border-bottom:1px solid var(--line)}.service-list span{color:var(--accent);font-size:.78rem;font-weight:800}.service-list h3{margin:0;font-family:var(--display);font-size:clamp(1.35rem,2.7vw,2.2rem);font-weight:600}.gallery-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:16px}.gallery-grid figure{grid-column:span 6;margin:0}.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid img{aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.gallery-grid figure:nth-child(3n) img{aspect-ratio:2/1}.gallery-grid figcaption{margin-top:8px;color:var(--muted);font-size:.75rem}.review-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0;border-top:1px solid var(--line)}blockquote{margin:0;padding:28px 28px 28px 0;border-bottom:1px solid var(--line)}blockquote+blockquote{padding-left:28px;border-left:1px solid var(--line)}.stars{color:var(--accent);letter-spacing:.08em}blockquote>p{min-height:6em;margin:18px 0;font-family:var(--display);font-size:1.15rem;line-height:1.7}blockquote footer{display:flex;flex-direction:column;gap:2px}blockquote footer span{color:var(--muted);font-size:.75rem}.video-frame{position:relative;overflow:hidden;aspect-ratio:16/9;border-radius:var(--radius);background:var(--ink)}.video-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.video-link{min-height:100px;display:flex;align-items:center;justify-content:space-between;padding:28px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);text-decoration:none;font-family:var(--display);font-size:clamp(1.3rem,3vw,2.2rem)}.contact{padding-bottom:64px}.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}.contact-links{display:flex;flex-direction:column;border-top:1px solid var(--line)}.contact-links a{padding:18px 0;border-bottom:1px solid var(--line);text-decoration:none;font-weight:700}.map-address{font-family:var(--display);font-size:clamp(1.4rem,3vw,2.4rem);line-height:1.45}.site-footer{display:flex;justify-content:space-between;gap:24px;width:min(calc(100% - 32px),var(--max));margin:auto;padding:28px 0 42px;color:var(--muted);font-size:.75rem}.site-footer a{text-decoration:none}.powered{font-weight:800;color:var(--ink)}
    a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
    @media(min-width:760px){.site-nav{padding-top:32px}.site-nav a:hover{opacity:.7}.button{transition:transform .18s cubic-bezier(.25,1,.5,1)}.button:hover{transform:translateY(-2px)}}
    @media(max-width:759px){.site-nav{padding-top:18px}.site-nav div a:not(:last-child){display:none}.hero{min-height:520px}.hero-content{padding:104px 0 36px}.hero h1{font-size:clamp(2.7rem,13vw,4.2rem)}.hero .tagline{margin-top:14px}.hero-actions{margin-top:20px}.section-heading,.about-grid,.contact-grid{grid-template-columns:1fr}.section-heading{gap:8px;margin-bottom:28px}.section-heading>p{margin-bottom:4px}.facts{margin-top:8px}.gallery-grid{gap:10px}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}blockquote+blockquote{padding-left:0;border-left:0}.site-footer{flex-direction:column}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition-duration:.01ms!important}}
  `
}

function variantStyles(template: TemplateId): string {
  if (template === 'vivid') {
    return `.hero{min-height:580px;background:#172147}.hero-media{left:42%;clip-path:polygon(14% 0,100% 0,100% 100%,0 100%)}.hero-media:after{background:linear-gradient(90deg,#172147 0,rgba(23,33,71,.84) 10%,rgba(23,33,71,.08) 76%)}.hero h1{max-width:8ch;font-family:var(--sans);font-size:clamp(3.4rem,7vw,6.5rem);font-weight:900;line-height:.9;text-shadow:6px 6px 0 var(--accent)}.kicker{display:inline-flex;padding:7px 12px;border-radius:999px;background:#f0c94c;color:#172147}.section{border:0}.section-heading{grid-template-columns:150px 1fr;align-items:end}.section-heading h2{font-family:var(--sans);font-weight:900}.about{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#f0c94c;color:#172147}.about .section-heading>p{color:#172147}.about-copy{font-family:var(--sans);font-weight:800}.services{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:#172147;color:#fffdf8}.services .service-list{display:grid;grid-template-columns:1fr 1fr}.gallery-grid img{border-radius:24px;box-shadow:8px 8px 0 var(--accent)}.review-list{gap:18px;border:0}.review-list blockquote{padding:28px;border:2px solid #172147;border-radius:22px;box-shadow:6px 6px 0 #172147}.contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--accent);color:#fff}@media(max-width:759px){.hero{min-height:500px}.hero-media{left:0;clip-path:none}.hero-media:after{background:linear-gradient(180deg,rgba(23,33,71,.05),#172147)}.hero h1{font-size:clamp(3rem,14vw,4.6rem);text-shadow:4px 4px 0 var(--accent)}.section-heading{grid-template-columns:1fr}.services .service-list{grid-template-columns:1fr}}`
  }
  if (template === 'calm') {
    return `.site-nav{position:relative;color:var(--ink)}.hero{min-height:auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(28px,5vw,72px);padding:16px max(16px,calc((100% - var(--max))/2)) 56px;background:var(--body)}.hero-media{position:relative;grid-column:2;min-height:500px}.hero-media:after{display:none}.hero-media img{filter:saturate(.72)}.hero-content{grid-column:1;grid-row:1;width:auto;padding:84px 0 48px;color:var(--ink)}.hero h1{font-size:clamp(2.8rem,5vw,5rem);font-weight:600}.hero .tagline{position:relative;padding-left:48px}.hero .tagline:before{position:absolute;left:0;top:.85em;width:30px;height:1px;background:var(--accent);content:""}.button{border-color:var(--ink)}.section-heading{grid-template-columns:180px 1fr}.gallery-grid{gap:12px}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 4}.gallery-grid figure:nth-child(2){margin-top:52px}.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}.gallery-grid figcaption{display:none}@media(max-width:759px){.site-nav{position:relative;color:var(--ink)}.hero{grid-template-columns:1fr;padding:0 16px 32px;gap:20px}.hero-media{grid-column:1;grid-row:1;min-height:260px}.hero-content{grid-column:1;grid-row:2;padding:0;color:var(--ink)}.hero h1{font-size:clamp(2.5rem,12vw,3.7rem)}.button{border-color:var(--ink)}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 12}.gallery-grid figure:nth-child(2){margin-top:0}}`
  }
  if (template === 'compact') {
    return `.site-nav{position:relative;color:var(--ink);border-bottom:1px solid var(--line)}.hero{min-height:auto;display:grid;grid-template-columns:1.15fr .85fr;width:min(calc(100% - 32px),var(--max));margin:32px auto 0;background:var(--surface);border:1px solid var(--line)}.hero-media{position:relative;grid-column:2;min-height:410px}.hero-media:after{display:none}.hero-content{grid-column:1;grid-row:1;width:auto;padding:56px;color:var(--ink)}.hero h1{font-family:var(--sans);font-size:clamp(2.7rem,4.5vw,4.4rem);font-weight:900}.hero .tagline{max-width:25ch}.button{border-color:var(--ink)}.section{padding-block:56px}.section-heading{grid-template-columns:150px 1fr}.section h2{font-size:clamp(1.8rem,3vw,2.8rem)}.about-grid{gap:48px}.service-list{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;border:0}.service-list article{display:block;padding:24px;border:1px solid var(--line)}.service-list span{display:block;margin-bottom:20px}.service-list h3{font-family:var(--sans);font-size:1.2rem}.gallery-grid figure,.gallery-grid figure:nth-child(3n){grid-column:span 6}.gallery-grid figure:nth-child(3n) img{aspect-ratio:4/3}@media(max-width:759px){.hero{grid-template-columns:1fr;margin-top:16px}.hero-media{grid-column:1;grid-row:1;min-height:220px}.hero-content{grid-column:1;grid-row:2;padding:28px 22px}.hero h1{font-size:2.6rem}.service-list{grid-template-columns:1fr}.section-heading{grid-template-columns:1fr}}`
  }
  if (template === 'mosaic') {
    return `.site-nav{position:relative;color:var(--ink)}.hero{min-height:auto;display:grid;grid-template-columns:.78fr 1.22fr;gap:20px;width:min(calc(100% - 32px),var(--max));margin:20px auto 0;background:transparent}.hero-media{position:relative;grid-column:2;min-height:500px;display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:1fr 1fr;gap:10px}.hero-media img,.hero-media img:not(:first-child){display:block;height:100%;min-height:0;object-fit:cover}.hero-media img:first-child{grid-row:1/3}.hero-media:after{display:none}.hero-content{grid-column:1;grid-row:1;width:auto;align-self:end;padding:40px 10px 36px 0;color:var(--ink)}.hero h1{font-size:clamp(2.8rem,5vw,5rem);font-weight:600}.button{border-color:var(--ink)}.section-heading{grid-template-columns:150px 1fr}.gallery-grid{gap:10px}.gallery-grid figure{grid-column:span 4}.gallery-grid figure:nth-child(3n){grid-column:span 8}.gallery-grid figure:nth-child(4n){grid-column:span 4}.gallery-grid img,.gallery-grid figure:nth-child(3n) img{aspect-ratio:1/1}.review-list blockquote{background:var(--surface);padding:28px}.contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--accent);color:#fff}@media(max-width:759px){.hero{grid-template-columns:1fr;margin-top:12px}.hero-media{grid-column:1;grid-row:1;min-height:300px}.hero-content{grid-column:1;grid-row:2;padding:8px 0 24px;color:var(--ink)}.hero h1{font-size:2.8rem}.gallery-grid figure,.gallery-grid figure:nth-child(3n),.gallery-grid figure:nth-child(4n){grid-column:span 12}.section-heading{grid-template-columns:1fr}}`
  }
  return `.site-nav{mix-blend-mode:difference}.hero{min-height:min(590px,72vh)}.hero-content{padding-left:clamp(0px,4vw,56px)}.hero h1{font-weight:600}.section{position:relative}.section:before{position:absolute;right:0;top:30px;color:color-mix(in srgb,var(--ink) 18%,transparent);font-family:var(--display);font-size:clamp(3rem,7vw,6rem);line-height:1}.about:before{content:"01"}.services:before{content:"02"}.gallery:before{content:"03"}.reviews:before{content:"04"}.contact:before{content:"05"}.about-grid{grid-template-columns:1.35fr .65fr}.about-copy:first-letter{float:left;margin:.11em .12em 0 0;color:var(--accent);font-size:4.2em;line-height:.7}.gallery-grid{gap:20px}.gallery-grid figure:nth-child(odd){grid-column:span 7}.gallery-grid figure:nth-child(even){grid-column:8/span 5;margin-top:48px}.gallery-grid figure:nth-child(3n){grid-column:span 12;margin-top:0}.contact{width:100%;max-width:none;padding-inline:max(16px,calc((100% - var(--max))/2));background:var(--ink);color:var(--surface)}@media(max-width:759px){.site-nav{mix-blend-mode:normal}.hero{min-height:500px}.hero-content{padding-left:0}.section:before{top:34px;font-size:3rem}.about-grid{grid-template-columns:1fr}.gallery-grid figure:nth-child(odd),.gallery-grid figure:nth-child(even),.gallery-grid figure:nth-child(3n){grid-column:span 12;margin-top:0}}`
}

function heroSizingStyles(template: TemplateId): string {
  if (template === 'editorial' || template === 'vivid') {
    return `.hero{min-height:480px;align-items:center}.hero-content{padding-top:72px;padding-bottom:18px}.hero h1{font-size:clamp(2.8rem,6vw,5rem)}@media(max-width:759px){.hero{min-height:420px}.hero-content{padding-top:64px;padding-bottom:14px}.hero h1{font-size:clamp(2.5rem,12vw,3.7rem)}}`
  }
  if (template === 'calm') {
    return `.hero-media{min-height:420px}.hero-content{padding-top:54px;padding-bottom:36px}@media(max-width:759px){.hero-media{min-height:190px}.hero-content{padding-top:0;padding-bottom:20px}}`
  }
  if (template === 'compact') {
    return `.hero-media{min-height:350px}.hero-content{padding:42px}@media(max-width:759px){.hero-media{min-height:180px}.hero-content{padding:24px 20px}}`
  }
  return `.hero-media{min-height:420px}.hero-content{padding-top:28px;padding-bottom:24px}@media(max-width:759px){.hero-media{min-height:240px}.hero-content{padding-top:4px;padding-bottom:18px}}`
}

export function renderSite(draft: BusinessDraft): string {
  const shared = sharedSections(draft)
  const title = `${escapeHtml(draft.name)}｜${escapeHtml(draft.category)}`
  const description = escapeHtml(draft.description)
  const heroImage = shared.hero?.url ?? ''
  const heroPhotos = [shared.hero, ...shared.gallery.slice(0, 2)].filter(Boolean)
  const facts = [
    draft.address ? `<li><span>地址</span><strong>${escapeHtml(draft.address)}</strong></li>` : '',
    draft.phone ? `<li><span>電話</span><strong>${escapeHtml(draft.phone)}</strong></li>` : '',
    ...shared.hours.map(
      (item, index) => `<li><span>${index === 0 ? '營業時間' : ''}</span><strong>${escapeHtml(item.label)}　${escapeHtml(item.value)}</strong></li>`,
    ),
  ]
    .filter(Boolean)
    .join('')

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
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800;900&family=Noto+Serif+TC:wght@500;600;700;900&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
  <style>${baseStyles(draft.template, shared.accent)}${variantStyles(draft.template)}${heroSizingStyles(draft.template)}</style>
</head>
<body>
  <a class="skip" href="#main" target="_self">跳至主要內容</a>
  <nav class="site-nav" aria-label="主要導覽"><strong>${escapeHtml(draft.name)}</strong><div><a href="#about" target="_self">關於我們</a>${shared.services.length ? '<a href="#services" target="_self">服務項目</a>' : ''}${shared.gallery.length ? '<a href="#gallery" target="_self">店家照片</a>' : ''}<a href="#contact" target="_self">聯絡資訊</a></div></nav>
  <main id="main">
    <header class="hero">
      <div class="hero-media">${heroPhotos.map((photo) => `<img src="${safeUrl(photo!.url)}" alt="${escapeHtml(photo!.alt)}">`).join('')}</div>
      <div class="hero-content"><p class="kicker">${escapeHtml(draft.category)}</p><h1>${escapeHtml(draft.name)}</h1><p class="tagline">${escapeHtml(draft.tagline)}</p><div class="hero-actions">${draft.googleMapsUrl ? `<a class="button primary" href="${safeUrl(draft.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">查看地圖</a>` : ''}${draft.phone ? `<a class="button" href="${phoneUrl(draft.phone)}">電話聯絡</a>` : ''}</div></div>
    </header>
    <section class="section about" id="about"><div class="section-heading"><p>ABOUT US</p><h2>一間店，也是一種生活的提案</h2></div><div class="about-grid"><p class="about-copy">${escapeHtml(draft.description)}</p><ul class="facts">${facts}</ul></div></section>
    ${shared.serviceHtml}
    ${shared.galleryHtml}
    ${shared.videoHtml}
    ${shared.reviewHtml}
    <section class="section contact" id="contact"><div class="section-heading"><p>VISIT & CONTACT</p><h2>期待與你見面</h2></div><div class="contact-grid"><div><p class="map-address">${escapeHtml(draft.address)}</p>${draft.googleMapsUrl ? `<a href="${safeUrl(draft.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">在 Google 地圖開啟 ↗</a>` : ''}</div><div class="contact-links">${shared.contactLinks}</div></div></section>
  </main>
  <footer class="site-footer"><span>© ${new Date().getFullYear()} ${escapeHtml(draft.name)}</span><a class="powered" href="https://lihidomain.com/" target="_blank" rel="noopener noreferrer">Powered by lihiDomain</a></footer>
</body>
</html>`
}

export function openPreview(draft: BusinessDraft): void {
  const blob = new Blob([renderSite(draft)], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
