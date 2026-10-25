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
  { name: 'studio-mobile', path: '/?demo=studio', width: 390, height: 844 },
]

const results = []
for (const item of cases) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1 })
  await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1_200)
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  await page.screenshot({ path: `${outputDir}/${item.name}.png`, fullPage: false })
  results.push({ ...item, ...dimensions, overflow: dimensions.content > dimensions.viewport })
  await page.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))

if (results.some((result) => result.overflow)) process.exitCode = 1
