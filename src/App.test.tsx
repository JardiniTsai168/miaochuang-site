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
    expect(screen.getByText('生成與 7 天預覽免費')).toBeInTheDocument()
    expect(screen.getByText(/正式收費與網域流程將由 lihi 訂閱機制處理/)).toBeInTheDocument()
  })

  it('offers brand creation after the template is selected', () => {
    saveDraft(createDemoBusiness())
    render(<App />)
    expect(screen.getByRole('button', { name: /建立品牌/ })).toBeInTheDocument()
    expect(screen.getByText(/下一步前往 lihi 購買網域/)).toBeInTheDocument()
    expect(screen.queryByText(/部署到 EmDash/)).not.toBeInTheDocument()
  })

  it('exposes deterministic review links for each flow step', () => {
    saveDraft(createDemoBusiness())
    window.history.replaceState({}, '', '/?demo=landing')
    const { unmount } = render(<App />)
    expect(screen.getByRole('heading', { name: /說出品牌的優勢/ })).toBeInTheDocument()
    unmount()

    window.history.replaceState({}, '', '/?demo=importing')
    render(<App />)
    expect(screen.getByRole('heading', { name: /正在整理資料，建立完整的店家故事/ })).toBeInTheDocument()
  })

  it('opens a requested template directly for review', () => {
    window.history.replaceState({}, '', '/?demo=studio&template=mosaic')
    render(<App />)
    expect(screen.getByRole('button', { name: /影像拼貼/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('影像拼貼', { selector: '.template-detail strong' })).toBeInTheDocument()
  })

  it('makes all five website templates visible and selectable', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness())
    render(<App />)
    expect(screen.getByRole('heading', { name: /先挑一個最像你店裡的版型/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /手作菜單/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /影像拼貼/ })).toBeInTheDocument()
    const vivid = screen.getByRole('button', { name: /醒目海報/ })
    await user.click(vivid)
    expect(vivid).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('醒目海報', { selector: '.template-detail strong' })).toBeInTheDocument()
  })

  it('offers five replaceable website image slots', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness(Date.now(), 0))
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^照片$/ }))

    expect(screen.getByText('5 個版位')).toBeInTheDocument()
    expect(screen.getAllByText('替換圖片')).toHaveLength(5)
    expect(screen.getByText('網站主視覺')).toBeInTheDocument()
    expect(screen.getByText('細節特寫')).toBeInTheDocument()
  })
})
