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
  })

  it('requires the complete brand brief', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /生成我的網站/ }))
    expect(screen.getByText(/請輸入產業類型/)).toBeInTheDocument()
  })

  it('shows the core promise and pricing disclosure', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /說出品牌的優勢/ })).toBeInTheDocument()
    expect(screen.getByText('第二年託管 NT$999／年')).toBeInTheDocument()
    expect(screen.getByText(/網域續約費另計/)).toBeInTheDocument()
  })

  it('moves a saved website draft to the domain handoff screen', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness())
    render(<App />)
    await user.click(screen.getByRole('button', { name: /確認網站，前往選網址/ }))
    expect(screen.getByRole('heading', { name: /選一個正式網址/ })).toBeInTheDocument()
    expect(screen.getByText(/lihiDomain 帳號、網域搜尋、結帳與部署/)).toBeInTheDocument()
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

  it('offers eight generated photo candidates with five selected by default', async () => {
    const user = userEvent.setup()
    saveDraft(createDemoBusiness(Date.now(), 0))
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^照片$/ }))

    const photoButtons = screen.getAllByRole('button').filter((button) => button.querySelector('.photo-picker img'))
    expect(photoButtons).toHaveLength(8)
    expect(photoButtons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(5)
    expect(screen.getByText('已選 5／上限 8')).toBeInTheDocument()

    await user.click(photoButtons[5])
    expect(screen.getByText('已選 6／上限 8')).toBeInTheDocument()
  })
})
