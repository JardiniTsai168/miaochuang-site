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
  if (item.name === 'studio-desktop') {
    const preview = page.frameLocator('iframe[title$="網站預覽"]')
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      preview.getByRole('link', { name: '查看地圖' }).click(),
    ])
    previewLinkSafe = page.url().includes('demo=studio')
    await popup.close()
  }
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  await page.screenshot({ path: `${outputDir}/${item.name}.png`, fullPage: false })
  results.push({ ...item, ...dimensions, overflow: dimensions.content > dimensions.viewport, ...(previewLinkSafe === undefined ? {} : { previewLinkSafe }) })
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))

if (results.some((result) => result.overflow || result.previewLinkSafe === false)) process.exitCode = 1
