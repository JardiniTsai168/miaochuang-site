export type IndustryPalette = {
  id: PaletteId
  name: string
  mood: string
  ink: string
  muted: string
  background: string
  surface: string
  soft: string
  accent: string
  onAccent: string
  border: string
}

export type PaletteId = 'hair' | 'beauty' | 'spa' | 'fitness' | 'creative' | 'cleaning' | 'food' | 'service' | 'coral' | 'plum' | 'ochre' | 'midnight'

export const paletteIds: PaletteId[] = ['hair', 'beauty', 'spa', 'fitness', 'creative', 'cleaning', 'food', 'service', 'coral', 'plum', 'ochre', 'midnight']

export const palettes: Record<PaletteId, IndustryPalette> = {
  hair: { id: 'hair', name: '暖棕沙龍', mood: '溫暖、手作、親切', ink: '#2E211D', muted: '#74615A', background: '#F8F2EE', surface: '#FFFDFC', soft: '#EEE0D8', accent: '#8C4938', onAccent: '#FFFFFF', border: '#D9C8BF' },
  beauty: { id: 'beauty', name: '莓果玫瑰', mood: '精緻、柔美、自信', ink: '#33202D', muted: '#796574', background: '#FBF3F7', surface: '#FFFCFE', soft: '#F1DCE7', accent: '#8F3F68', onAccent: '#FFFFFF', border: '#DFC7D4' },
  spa: { id: 'spa', name: '森林鼠尾草', mood: '自然、放鬆、平衡', ink: '#203029', muted: '#617068', background: '#F2F6F1', surface: '#FCFEFC', soft: '#DDE8DE', accent: '#3F6B55', onAccent: '#FFFFFF', border: '#C9D7CC' },
  fitness: { id: 'fitness', name: '動能海軍藍', mood: '專業、可靠、行動力', ink: '#17243A', muted: '#607087', background: '#F2F6FA', surface: '#FFFFFF', soft: '#DCE7F2', accent: '#245B91', onAccent: '#FFFFFF', border: '#C7D5E4' },
  creative: { id: 'creative', name: '藝廊鈷藍', mood: '創意、現代、鮮明', ink: '#202033', muted: '#68677A', background: '#F4F3FA', surface: '#FFFFFF', soft: '#E4E1F3', accent: '#4A45A5', onAccent: '#FFFFFF', border: '#CFCCE4' },
  cleaning: { id: 'cleaning', name: '清新湖水綠', mood: '潔淨、清爽、安心', ink: '#153037', muted: '#5E7479', background: '#F0F8F8', surface: '#FCFFFF', soft: '#D7ECEB', accent: '#176B72', onAccent: '#FFFFFF', border: '#C3DDDC' },
  food: { id: 'food', name: '咖啡陶土', mood: '風味、質感、溫度', ink: '#32241C', muted: '#75645A', background: '#F9F3EA', surface: '#FFFDF9', soft: '#EEDFCB', accent: '#8A4932', onAccent: '#FFFFFF', border: '#DDCBB8' },
  service: { id: 'service', name: 'lihi 品牌莓紅', mood: '友善、活力、數位感', ink: '#1A1A5E', muted: '#666582', background: '#FFF5F8', surface: '#FFFFFF', soft: '#FFE0EA', accent: '#B82F67', onAccent: '#FFFFFF', border: '#E6CCD6' },
  coral: { id: 'coral', name: '珊瑚磚紅', mood: '熱情、活潑、有人情味', ink: '#34201C', muted: '#765F59', background: '#FFF4F0', surface: '#FFFCFA', soft: '#F5DDD5', accent: '#93402F', onAccent: '#FFFFFF', border: '#E2C6BD' },
  plum: { id: 'plum', name: '深梅紫', mood: '成熟、優雅、精品感', ink: '#2D2030', muted: '#726276', background: '#F8F2F9', surface: '#FFFDFE', soft: '#EADCEA', accent: '#6D3B6F', onAccent: '#FFFFFF', border: '#D7C5D8' },
  ochre: { id: 'ochre', name: '晨光赭金', mood: '沉穩、經典、職人感', ink: '#302719', muted: '#716753', background: '#FBF7EC', surface: '#FFFEFA', soft: '#EEE5CB', accent: '#76520B', onAccent: '#FFFFFF', border: '#DDD1B6' },
  midnight: { id: 'midnight', name: '午夜靛藍', mood: '理性、俐落、高信任', ink: '#172039', muted: '#626B80', background: '#F3F5FA', surface: '#FFFFFF', soft: '#DEE4F0', accent: '#283B6B', onAccent: '#FFFFFF', border: '#C9D1E1' },
}

export function getIndustryPaletteOptions(industry: string): [PaletteId, PaletteId, PaletteId] {
  if (industry.includes('美髮')) return ['hair', 'coral', 'midnight']
  if (/美容|美甲|美睫/u.test(industry)) return ['beauty', 'plum', 'ochre']
  if (/按摩|SPA/u.test(industry)) return ['spa', 'cleaning', 'ochre']
  if (/健身|瑜伽|教練/u.test(industry)) return ['fitness', 'midnight', 'coral']
  if (/攝影|設計|工作室/u.test(industry)) return ['creative', 'plum', 'midnight']
  if (/清潔|維修/u.test(industry)) return ['cleaning', 'fitness', 'spa']
  if (/咖啡|甜點|餐飲|烘焙|飲料/u.test(industry)) return ['food', 'ochre', 'coral']
  return ['service', 'fitness', 'creative']
}

export function normalizePaletteRecommendations(industry: string, recommendations?: readonly string[]): [PaletteId, PaletteId, PaletteId] {
  const valid = (recommendations || []).filter((id): id is PaletteId => paletteIds.includes(id as PaletteId))
  const unique = [...new Set(valid)]
  for (const fallback of getIndustryPaletteOptions(industry)) if (!unique.includes(fallback)) unique.push(fallback)
  return unique.slice(0, 3) as [PaletteId, PaletteId, PaletteId]
}

export function getIndustryPalette(industry: string, paletteId?: string): IndustryPalette {
  const selected = paletteId && paletteIds.includes(paletteId as PaletteId) ? paletteId as PaletteId : getIndustryPaletteOptions(industry)[0]
  return palettes[selected]
}

export function industryPaletteStyle(industry: string, paletteId?: string): string {
  const palette = getIndustryPalette(industry, paletteId)
  return [
    `--industry-ink:${palette.ink}`,
    `--industry-muted:${palette.muted}`,
    `--industry-bg:${palette.background}`,
    `--industry-surface:${palette.surface}`,
    `--industry-soft:${palette.soft}`,
    `--industry-accent:${palette.accent}`,
    `--industry-on-accent:${palette.onAccent}`,
    `--industry-border:${palette.border}`,
  ].join(';')
}
