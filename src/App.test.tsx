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

  it('explains how to fix an invalid URL', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Google 商家網址'), 'https://example.com/store')
    await user.click(screen.getByRole('button', { name: /生成我的網站/ }))
    expect(screen.getByText(/請貼上完整的 Google 地圖商家網址/)).toBeInTheDocument()
  })

  it('shows the core promise and pricing disclosure', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /貼上 Google 商家/ })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: /店家名片/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /照片誌/ })).toBeInTheDocument()
    const vivid = screen.getByRole('button', { name: /招牌感/ })
    await user.click(vivid)
    expect(vivid).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('招牌感', { selector: '.template-detail strong' })).toBeInTheDocument()
  })
})
