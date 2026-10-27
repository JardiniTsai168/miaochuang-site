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
  { name: 'studio-vivid-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '招牌感' },
  { name: 'studio-calm-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '留白所' },
  { name: 'studio-compact-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '店家名片' },
  { name: 'studio-mosaic-desktop', path: '/?demo=studio', width: 1440, height: 1000, click: '照片誌' },
  { name: 'studio-mobile', path: '/?demo=studio', width: 390, height: 844 },
  { name: 'studio-preview-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['查看網站', '手機版預覽'] },
  { name: 'studio-vivid-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['招牌感', '查看網站', '手機版預覽'] },
  { name: 'studio-calm-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['留白所', '查看網站', '手機版預覽'] },
  { name: 'studio-compact-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['店家名片', '查看網站', '手機版預覽'] },
  { name: 'studio-mosaic-mobile', path: '/?demo=studio', width: 390, height: 844, clicks: ['照片誌', '查看網站', '手機版預覽'] },
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

    const lastTemplate = page.getByRole('button', { name: /照片誌/ })
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
  await page.screenshot({ path: `${outputDir}/${item.name}.png`, fullPage: false })
  results.push({
    ...item,
    ...dimensions,
    overflow: dimensions.content > dimensions.viewport,
    brokenImages,
    ...(previewLinkSafe === undefined ? {} : { previewLinkSafe }),
    ...(editorPanelScrolls === undefined ? {} : { editorPanelScrolls, availablePhotos }),
  })
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))

if (results.some((result) => result.overflow || result.brokenImages > 0 || result.previewLinkSafe === false || result.editorPanelScrolls === false || (result.availablePhotos !== undefined && result.availablePhotos < 10))) process.exitCode = 1
