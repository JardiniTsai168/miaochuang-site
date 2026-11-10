const API_BASE_URL = (import.meta.env.VITE_GENERATION_API_BASE_URL || '').replace(/\/$/u, '')

export type DomainSuggestionResult = { suggestions: string[]; remaining: number }

export async function getDomainSuggestions(brandName: string): Promise<DomainSuggestionResult> {
  const response = await fetch(`${API_BASE_URL}/api/domain-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandName }),
  }).catch(() => null)
  if (!response) throw new Error('目前無法連線到網域推薦服務。')
  const payload = await response.json().catch(() => null) as (DomainSuggestionResult & { error?: { message?: string } }) | null
  if (!response.ok) throw new Error(payload?.error?.message || '網域推薦失敗，請稍後再試。')
  if (!payload || !Array.isArray(payload.suggestions) || payload.suggestions.length !== 3) throw new Error('網域推薦回傳格式不完整。')
  return payload
}
