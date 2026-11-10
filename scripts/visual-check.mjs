import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const baseUrl = process.env.MIAOCHUANG_BASE_URL || 'http://127.0.0.1:4173'
const outputDir = process.env.MIAOCHUANG_VISUAL_OUTPUT || '/tmp/miaochuang-visual-check'
const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath })

const cases = [
  { name: 'landing-desktop', path: '/', width: 1440, height: 1000 },
  { name: 'landing-fold-desktop', path: '/', width: 1440, height: 900 },
  { name: 'landing-mobile', path: '/', width: 390, height: 844 },
  { name: 'importing-desktop', path: '/?demo=importing', width: 1440, height: 1000 },
  { name: 'importing-mobile', path: '/?demo=importing', width: 390, height: 844 },
  { name: 'studio-desktop', path: '/?demo=studio', width: 1440, height: 1000 },
  { name: 'studio-portfolio-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: 'Portfolio' },
  { name: 'studio-blog-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: 'Blog' },
  { name: 'studio-starter-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: 'Starter' },
  { name: 'studio-hair-marketing-desktop', path: `/?demo=studio&industry=${encodeURIComponent('美髮')}`, width: 1440, height: 1000 },
  { name: 'studio-beauty-blog-desktop', path: `/?demo=studio&template=blog&industry=${encodeURIComponent('美容／美甲／美睫')}`, width: 1440, height: 1000 },
  { name: 'studio-mobile', path: '/?demo=studio', width: 390, height: 844 },
  { name: 'studio-preview-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['查看網站', '手機版預覽'] },
  { name: 'studio-portfolio-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['Portfolio', '查看網站', '手機版預覽'] },
  { name: 'studio-blog-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['Blog', '查看網站', '手機版預覽'] },
  { name: 'studio-starter-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['Starter', '查看網站', '手機版預覽'] },
  { name: 'studio-spa-starter-mobile', path: `/?demo=studio&template=starter&industry=${encodeURIComponent('按摩／SPA')}`, width: 390, height: 844, clicks: ['查看網站', '手機版預覽'] },
  { name: 'studio-spa-ochre-mobile', path: `/?demo=studio&template=starter&industry=${encodeURIComponent('按摩／SPA')}&palette=ochre`, width: 390, height: 844, clicks: ['查看網站', '手機版預覽'] },
  { name: 'launch-desktop', path: '/?demo=launch', width: 1440, height: 900 },
  { name: 'launch-mobile', path: '/?demo=launch', width: 390, height: 844 },
  { name: 'domain-desktop', path: `/?demo=domain&step=domain&brand=${encodeURIComponent('東東')}`, width: 1440, height: 900 },
  { name: 'domain-mobile', path: `/?demo=domain&step=domain&brand=${encodeURIComponent('東東')}`, width: 390, height: 844 },
]

const results = []
for (const item of cases) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1 })
  await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'domcontentloaded' })
  await page
    .locator('main h1')
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(async () => {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.locator('main h1').first().waitFor({ timeout: 15_000 })
    })
  await page.waitForTimeout(800)
  for (const label of [...(item.clicks || []), ...(item.click ? [item.click] : [])]) {
    await page.getByRole('button', { name: new RegExp(label) }).click()
    await page.waitForTimeout(500)
  }
  let previewLinkSafe
  let editorPanelScrolls
  let availablePhotos
  if (item.name === 'studio-desktop') {
    const preview = page.frameLocator('iframe[title$="網站預覽"]')
    const lineLink = preview.getByRole('link', { name: 'LINE 預約' }).first()
    previewLinkSafe = await lineLink.evaluate((link) => link.target === '_blank' && link.rel.includes('noopener') && link.href.startsWith('https://line.me/')).catch(() => false)

    const lastTemplate = page.getByRole('button', { name: /Starter/ })
    const beforeScroll = await lastTemplate.boundingBox()
    await page.mouse.move(200, 600)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(200)
    const afterScroll = await lastTemplate.boundingBox()
    editorPanelScrolls = Boolean(beforeScroll && afterScroll && afterScroll.y < beforeScroll.y - 50)
    await page.locator('.panel-scroll').evaluate((element) => {
      element.scrollTop = 0
    })

    await page.getByRole('button', { name: /^照片$/ }).click()
    availablePhotos = await page.locator('.photo-replace img').count()
    await page.getByRole('button', { name: /^版型$/ }).click()
  }
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  const headerMetrics = await page.evaluate(() => {
    const header = document.querySelector('.app-header')?.getBoundingClientRect()
    const logo = document.querySelector('.app-header .brand img')?.getBoundingClientRect()
    const brandName = document.querySelector('.app-header .brand-name')
    if (!header || !logo) return undefined
    const expectedLeft = window.innerWidth <= 390 ? 16 : 100
    const expectedLogoWidth = window.innerWidth <= 390 ? 72 : 82
    const logoCenterOffset = Math.abs(logo.top + logo.height / 2 - (header.top + header.height / 2))
    const brandNameVisible = brandName ? getComputedStyle(brandName).display !== 'none' : false
    return {
      headerLeft: header.left,
      headerHeight: header.height,
      logoLeft: logo.left,
      logoWidth: logo.width,
      logoCenterOffset,
      brandNameVisible,
      aligned:
        Math.abs(header.left - expectedLeft) <= 1 &&
        Math.abs(logo.left - expectedLeft) <= 1 &&
        Math.abs(logo.width - expectedLogoWidth) <= 1 &&
        Math.abs(header.height - 72) <= 1 &&
        logoCenterOffset <= 1 &&
        (window.innerWidth <= 390 ? !brandNameVisible : brandNameVisible),
    }
  })
  const pageTitle = await page
    .locator('main h1')
    .first()
    .evaluate((heading) => {
      const style = getComputedStyle(heading)
      const lineHeight = Number.parseFloat(style.lineHeight)
      const rect = heading.getBoundingClientRect()
      return {
        fontSize: Number.parseFloat(style.fontSize),
        lineCount: Math.round(rect.height / lineHeight),
      }
    })
    .catch(() => undefined)
  const foldContentFits =
    item.name === 'landing-fold-desktop'
      ? await page.evaluate(() => {
          const form = document.querySelector('.brief-form')?.getBoundingClientRect()
          const preview = document.querySelector('.hero-demo')?.getBoundingClientRect()
          const previewWindow = document.querySelector('.demo-window')?.getBoundingClientRect()
          const title = document.querySelector('.hero-copy h1')?.getBoundingClientRect()
          const note = document.querySelector('.note-source')?.getBoundingClientRect()
          const lineHeight = title ? Number.parseFloat(getComputedStyle(document.querySelector('.hero-copy h1')).lineHeight) : 0
          const titleLines = title && lineHeight ? Math.round(title.height / lineHeight) : 0
          const overlapArea = title && note ? Math.max(0, Math.min(title.right, note.right) - Math.max(title.left, note.left)) * Math.max(0, Math.min(title.bottom, note.bottom) - Math.max(title.top, note.top)) : 0
          const noteWindowOverlap = note && previewWindow ? Math.max(0, Math.min(note.right, previewWindow.right) - Math.max(note.left, previewWindow.left)) * Math.max(0, Math.min(note.bottom, previewWindow.bottom) - Math.max(note.top, previewWindow.top)) : 0
          return Boolean(form && preview && form.bottom <= window.innerHeight && preview.bottom <= window.innerHeight && Math.abs(form.bottom - preview.bottom) <= 4 && titleLines === 1 && overlapArea === 0 && noteWindowOverlap === 0)
        })
      : undefined
  const launchFoldFits =
    item.name === 'launch-desktop'
      ? await page.evaluate(() => {
          const domainValue = document.querySelector('.domain-value')?.getBoundingClientRect()
          const reset = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('重新開始'))?.getBoundingClientRect()
          const back = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('回到網站設計'))?.getBoundingClientRect()
          return Boolean(domainValue && reset && back && domainValue.bottom <= window.innerHeight && back.left < reset.left)
        })
      : undefined
  const launchMobileDensity =
    item.name === 'launch-mobile'
      ? await page.evaluate(() => {
          const copyLines = [...document.querySelectorAll('.launch-option-copy li')].map((item) => {
            const rect = item.getBoundingClientRect()
            const lineHeight = Number.parseFloat(getComputedStyle(item).lineHeight)
            return Math.round(rect.height / lineHeight)
          })
          const cards = [...document.querySelectorAll('.domain-benefits article')].map((card) => card.getBoundingClientRect().height)
          return { allOptionCopySingleLine: copyLines.every((lines) => lines === 1), maxBenefitCardHeight: Math.max(0, ...cards) }
        })
      : undefined
  for (const frame of page.frames()) {
    await frame.evaluate(async () => {
      const images = [...document.images]
      images.forEach((img) => {
        img.loading = 'eager'
      })
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true })
                img.addEventListener('error', resolve, { once: true })
                window.setTimeout(resolve, 3_000)
              }),
        ),
      )
    })
  }
  const brokenImages = (
    await Promise.all(
      page.frames().map(async (frame) => {
        try {
          return await frame.evaluate(() => [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).length)
        } catch {
          return 0
        }
      }),
    )
  ).reduce((total, count) => total + count, 0)
  const previewFrame = page.frames().find((frame) => frame !== page.mainFrame() && frame.locator('h1').first())
  let heroTitle
  let heroDecorOverlap
  let templateMetrics
  if (item.name.startsWith('studio-') && previewFrame) {
    heroTitle = await previewFrame
      .locator('h1')
      .first()
      .evaluate((heading) => {
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
      })
      .catch(() => undefined)
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
      const sectionPaddingMax = Math.max(
        0,
        ...sections.flatMap((section) => {
          const style = getComputedStyle(section)
          return [Number.parseFloat(style.paddingTop), Number.parseFloat(style.paddingBottom)]
        }),
      )
      const layout = document.documentElement.dataset.layout
      const protectedImageFits = []
      return { layout, sectionPaddingMax, protectedImageFits, frameOverflow: document.documentElement.scrollWidth > window.innerWidth }
    })
  }
  await page.screenshot({ path: `${outputDir}/${item.name}.png`, fullPage: false })
  results.push({
    ...item,
    ...dimensions,
    overflow: dimensions.content > dimensions.viewport,
    brokenImages,
    ...(headerMetrics === undefined ? {} : { headerMetrics }),
    ...(pageTitle === undefined ? {} : { pageTitle }),
    ...(foldContentFits === undefined ? {} : { foldContentFits }),
    ...(launchFoldFits === undefined ? {} : { launchFoldFits }),
    ...(launchMobileDensity === undefined ? {} : { launchMobileDensity }),
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

if (results.some((result) => result.overflow || result.brokenImages > 0 || result.headerMetrics?.aligned === false || result.foldContentFits === false || result.launchFoldFits === false || (result.launchMobileDensity && (!result.launchMobileDensity.allOptionCopySingleLine || result.launchMobileDensity.maxBenefitCardHeight > 100)) || result.previewLinkSafe === false || result.editorPanelScrolls === false || (result.availablePhotos !== undefined && result.availablePhotos !== 5) || (result.pageTitle && (result.pageTitle.fontSize > (result.width <= 390 ? 38 : 48) || result.pageTitle.lineCount > 2)) || (result.heroTitle && (result.heroTitle.fontSize > (result.width <= 390 ? 36 : 48) || result.heroTitle.lineCount > 2 || result.heroTitle.outOfHero)) || (result.heroDecorOverlap !== undefined && result.heroDecorOverlap > 0) || (result.templateMetrics && (result.templateMetrics.frameOverflow || result.templateMetrics.sectionPaddingMax > (result.width <= 390 ? 56 : 72) || result.templateMetrics.protectedImageFits.some((fit) => fit !== 'contain'))))) process.exitCode = 1
