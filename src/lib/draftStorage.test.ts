import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoBusiness } from '../data/demoBusiness'
import { clearDraft, formatRemainingTime, loadDraft, saveDraft } from './draftStorage'

describe('draft storage', () => {
  beforeEach(() => localStorage.clear())

  it('loads an unexpired draft', () => {
    const draft = createDemoBusiness(1_000)
    saveDraft(draft)
    expect(loadDraft(2_000)?.name).toBe(draft.name)
  })

  it('removes an expired draft', () => {
    const draft = createDemoBusiness(1_000)
    saveDraft({ ...draft, expiresAt: 2_000 })
    expect(loadDraft(2_001)).toBeNull()
  })

  it('clears drafts and formats remaining hours', () => {
    saveDraft(createDemoBusiness())
    clearDraft()
    expect(loadDraft()).toBeNull()
    expect(formatRemainingTime(3_600_001, 1)).toBe('1 小時')
  })
})
