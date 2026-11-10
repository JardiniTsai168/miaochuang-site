import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createDemoBusiness } from './data/demoBusiness'
import { saveDraft } from './lib/draftStorage'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('requires the complete brand brief', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /生成我的網站/ }))
    expect(screen.getByText(/請選擇產業類型/)).toBeInTheDocument()
  })

  it('shows the core promise and pricing disclosure', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /說出品牌的優勢/ })).toBeInTheDocument()
    expect(screen.queryByText('by lihiDomain')).not.toBeInTheDocument()
    expect(screen.getByText('生成與 30 天預覽免費')).toBeInTheDocument()
    expect(screen.getByText(/正式收費與網域流程將由 lihi 訂閱機制處理/)).toBeInTheDocument()
  })

  it('moves from the editor to website launch choices', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness())
    render(<App />)
    expect(screen.getByRole('button', { name: /網站上線/ })).toBeInTheDocument()
    expect(screen.getByText('下一步，部署你的網站讓它上線')).toBeInTheDocument()
    expect(screen.queryByText(/部署到 EmDash/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /網站上線/ }))
    expect(screen.getByRole('heading', { name: /選擇網站上線方式/ })).toBeInTheDocument()
    expect(screen.queryByText('先用公共網址快速分享，或直接建立屬於自己的品牌網域。')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /部署到公共網域/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /部署到屬於自己的品牌網域/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新開始' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '回到網站設計' })).toBeInTheDocument()
    expect(screen.queryByText('by lihiDomain')).not.toBeInTheDocument()
    expect(screen.getByText('網站發布後無法再次編輯')).toBeInTheDocument()
    expect(screen.getByText('網站自發布日起保留 30 天')).toBeInTheDocument()
    expect(screen.queryByText('使用專屬網域，讓品牌更容易被記住')).not.toBeInTheDocument()
    expect(screen.getByText('專屬後台，隨時更新網站內容')).toBeInTheDocument()
    expect(screen.getByText('Cloudflare 全球安全網路防護')).toBeInTheDocument()
    expect(screen.getByText('申請網域，第一年網站服務免費')).toBeInTheDocument()
    expect(screen.getByText('使用專屬網域，減少詐騙，讓品牌更容易被記住。')).toBeInTheDocument()
    expect(screen.getByText('網域，是品牌的起點。')).toBeInTheDocument()
    expect(screen.queryByText(/它是品牌被記住的名字/)).not.toBeInTheDocument()
    expect(screen.queryByText(/功能內容參考 lihiDomain/)).not.toBeInTheDocument()
  })

  it('exposes deterministic review links for each flow step', () => {
    saveDraft(createDemoBusiness())
    window.history.replaceState({}, '', '/?demo=landing')
    const { unmount } = render(<App />)
    expect(screen.getByRole('heading', { name: /說出品牌的優勢/ })).toBeInTheDocument()
    unmount()

    window.history.replaceState({}, '', '/?demo=importing')
    const importing = render(<App />)
    expect(screen.getByRole('heading', { name: /正在整理資料，建立完整的店家故事/ })).toBeInTheDocument()
    importing.unmount()

    window.history.replaceState({}, '', '/?demo=launch')
    render(<App />)
    expect(screen.getByRole('heading', { name: /選擇網站上線方式/ })).toBeInTheDocument()
  })

  it('shows brand-name suggestions before lihi domain search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          suggestions: ['sunnywalk.com', 'sunnywalk.tw', 'sunnywalkcafe.com'],
          remaining: 4,
        }),
      ),
    )
    window.history.replaceState({}, '', '/?demo=domain')
    render(<App />)
    expect(screen.getByRole('heading', { name: /找到讓人記得住的品牌網域/ })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /sunnywalk.com/ })).toBeInTheDocument()
    expect(screen.getByText(/剩餘 4 次/)).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('opens a requested template directly for review', () => {
    window.history.replaceState({}, '', '/?demo=studio&template=portfolio')
    render(<App />)
    expect(screen.getByRole('button', { name: /Portfolio/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Portfolio', { selector: '.template-detail strong' })).toBeInTheDocument()
  })

  it('shows three AI color recommendations and lets the user select one', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', `/?demo=studio&industry=${encodeURIComponent('按摩／SPA')}`)
    render(<App />)
    expect(screen.getByLabelText('AI 推薦色系')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /森林鼠尾草/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /清新湖水綠/ })).toBeInTheDocument()
    const ochre = screen.getByRole('button', { name: /晨光赭金/ })
    await user.click(ochre)
    expect(ochre).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('已套用「晨光赭金」')).toBeInTheDocument()
  })

  it('makes all four official EmDash templates visible and selectable', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness())
    render(<App />)
    expect(screen.getByRole('heading', { name: /選擇網站的內容結構/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Marketing/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Portfolio/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Blog/ })).toBeInTheDocument()
    const starter = screen.getByRole('button', { name: /Starter/ })
    await user.click(starter)
    expect(starter).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Starter', { selector: '.template-detail strong' })).toBeInTheDocument()
  })

  it('offers five replaceable website image slots', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness(Date.now(), 0))
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^照片$/ }))

    expect(screen.getByText('5 個版位')).toBeInTheDocument()
    expect(screen.getAllByText('替換圖片')).toHaveLength(5)
    expect(screen.queryByText('網站主視覺')).not.toBeInTheDocument()
    expect(screen.queryByText('細節特寫')).not.toBeInTheDocument()
  })
})
