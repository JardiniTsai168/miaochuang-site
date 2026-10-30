import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const baseUrl = process.env.MIAOCHUANG_BASE_URL || 'http://127.0.0.1:4173'
const outputDir = process.env.MIAOCHUANG_VISUAL_OUTPUT || '/tmp/miaochuang-visual-check'
const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath })

const cases = [
  { name: 'landing-desktop', path: '/', width: 1440, height: 1000 },
  { name: 'landing-mobile', path: '/', width: 390, height: 844 },
  { name: 'studio-desktop', path: '/?demo=studio', width: 1440, height: 1000 },
  { name: 'studio-vivid-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '醒目海報' },
  { name: 'studio-calm-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '靜謐藝廊' },
  { name: 'studio-compact-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '手作菜單' },
  { name: 'studio-mosaic-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '影像拼貼' },
  { name: 'studio-mobile', path: '/?demo=studio', width: 390, height: 844 },
  { name: 'studio-preview-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['查看網站', '手機版預覽'] },
  { name: 'studio-vivid-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['醒目海報', '查看網站', '手機版預覽'] },
  { name: 'studio-calm-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['靜謐藝廊', '查看網站', '手機版預覽'] },
  { name: 'studio-compact-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['手作菜單', '查看網站', '手機版預覽'] },
  { name: 'studio-mosaic-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['影像拼貼', '查看網站', '手機版預覽'] },
  { name: 'ready-desktop', path: '/?demo=ready', width: 1440, height: 1000 },
  { name: 'ready-mobile', path: '/?demo=ready', width: 390, height: 844 },
]

const results = []
for (const item of cases) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1 })
  await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1_200)
  for (const label of [...(item.clicks || []), ...(item.click ? [item.click] : [])]) {
    await page.getByRole('button', { name: new RegExp(label) }).click()
    await page.waitForTimeout(500)
  }
  let previewLinkSafe
  let editorPanelScrolls
  let availablePhotos
  if (item.name === 'studio-desktop') {
    const preview = page.frameLocator('iframe[title$="網站預覽"]')
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      preview.getByRole('link', { name: '查看地圖' }).click(),
    ])
    previewLinkSafe = page.url().includes('demo=studio')
    await popup.close()

    const lastTemplate = page.getByRole('button', { name: /影像拼貼/ })
    const beforeScroll = await lastTemplate.boundingBox()
    await page.mouse.move(200, 600)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(200)
    const afterScroll = await lastTemplate.boundingBox()
    editorPanelScrolls = Boolean(beforeScroll && afterScroll && afterScroll.y < beforeScroll.y - 50)
    await page.locator('.panel-scroll').evaluate((element) => { element.scrollTop = 0 })

    await page.getByRole('button', { name: /^照片$/ }).click()
    availablePhotos = await page.locator('button[aria-pressed] img').count()
    await page.getByRole('button', { name: /^版型$/ }).click()
  }
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  for (const frame of page.frames()) {
    await frame.evaluate(async () => {
      const images = [...document.images]
      images.forEach((img) => { img.loading = 'eager' })
      await Promise.all(images.map((img) => img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true })
            img.addEventListener('error', resolve, { once: true })
            window.setTimeout(resolve, 3_000)
          })))
    })
  }
  const brokenImages = (await Promise.all(page.frames().map(async (frame) => {
    try {
      return await frame.evaluate(() => [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).length)
    } catch {
      return 0
    }
  }))).reduce((total, count) => total + count, 0)
  const previewFrame = page.frames().find((frame) => frame !== page.mainFrame() && frame.locator('h1').first())
  let heroTitle
  let heroDecorOverlap
  let templateMetrics
  if (item.name.startsWith('studio-') && previewFrame) {
    heroTitle = await previewFrame.locator('h1').first().evaluate((heading) => {
      const style = getComputedStyle(heading)
      const fontSize = Number.parseFloat(style.fontSize)
      const lineHeight = Number.parseFloat(style.lineHeight)
      const headingRect = heading.getBoundingClientRect()
      const heroRect = heading.closest('.hero')?.getBoundingClientRect()
      return {
        fontSize,
        lineCount: Math.round(headingRect.height / lineHeight),
        outOfHero: heroRect ? headingRect.left < heroRect.left - 1 || headingRect.right > heroRect.right + 1 : false,
      }
    }).catch(() => undefined)
    if (item.name === 'studio-desktop') {
      heroDecorOverlap = await previewFrame.evaluate(() => {
        const index = document.querySelector('.hero-index')?.getBoundingClientRect()
        const content = document.querySelector('.hero-content')?.getBoundingClientRect()
        if (!index || !content) return undefined
        const overlapWidth = Math.max(0, Math.min(index.right, content.right) - Math.max(index.left, content.left))
        const overlapHeight = Math.max(0, Math.min(index.bottom, content.bottom) - Math.max(index.top, content.top))
        return Math.round(overlapWidth * overlapHeight)
      })
    }
    templateMetrics = await previewFrame.evaluate(() => {
      const sections = [...document.querySelectorAll('.section')]
      const sectionPaddingMax = Math.max(0, ...sections.flatMap((section) => {
        const style = getComputedStyle(section)
        return [Number.parseFloat(style.paddingTop), Number.parseFloat(style.paddingBottom)]
      }))
      const layout = document.body.dataset.layout
      const protectedImageFits = ['calm', 'compact'].includes(layout || '')
        ? [...document.querySelectorAll('.hero-media img')].map((image) => getComputedStyle(image).objectFit)
        : []
      const media = document.querySelector('.hero-media')?.getBoundingClientRect()
      const overlay = document.querySelector('.industry-art')?.getBoundingClientRect()
      const mediaOverlayArea = media && overlay && ['calm', 'compact'].includes(layout || '')
        ? Math.round(Math.max(0, Math.min(media.right, overlay.right) - Math.max(media.left, overlay.left)) * Math.max(0, Math.min(media.bottom, overlay.bottom) - Math.max(media.top, overlay.top)))
        : 0
      return { layout, sectionPaddingMax, protectedImageFits, mediaOverlayArea, frameOverflow: document.documentElement.scrollWidth > window.innerWidth }
    })
  }
  await page.screenshot({ path: `${outputDir}/${item.name}.png`, fullPage: false })
  results.push({
    ...item,
    ...dimensions,
    overflow: dimensions.content > dimensions.viewport,
    brokenImages,
    ...(heroTitle === undefined ? {} : { heroTitle }),
    ...(heroDecorOverlap === undefined ? {} : { heroDecorOverlap }),
    ...(templateMetrics === undefined ? {} : { templateMetrics }),
    ...(previewLinkSafe === undefined ? {} : { previewLinkSafe }),
    ...(editorPanelScrolls === undefined ? {} : { editorPanelScrolls, availablePhotos }),
  })
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))

if (results.some((result) => result.overflow || result.brokenImages > 0 || result.previewLinkSafe === false || result.editorPanelScrolls === false || (result.availablePhotos !== undefined && result.availablePhotos !== 8) || (result.heroTitle && (result.heroTitle.fontSize > (result.width <= 390 ? 44 : 64) || result.heroTitle.lineCount > 1 || result.heroTitle.outOfHero)) || (result.heroDecorOverlap !== undefined && result.heroDecorOverlap > 0) || (result.templateMetrics && (result.templateMetrics.frameOverflow || result.templateMetrics.sectionPaddingMax > (result.width <= 390 ? 52 : 64) || result.templateMetrics.protectedImageFits.some((fit) => fit !== 'contain') || result.templateMetrics.mediaOverlayArea > 0)))) process.exitCode = 1
