export type IndustryPalette = {
  id: 'hair' | 'beauty' | 'spa' | 'fitness' | 'creative' | 'cleaning' | 'food' | 'service'
  name: string
  ink: string
  muted: string
  background: string
  surface: string
  soft: string
  accent: string
  onAccent: string
  border: string
}

const palettes: Record<IndustryPalette['id'], IndustryPalette> = {
  hair: { id: 'hair', name: '暖棕沙龍', ink: '#2E211D', muted: '#74615A', background: '#F8F2EE', surface: '#FFFDFC', soft: '#EEE0D8', accent: '#8C4938', onAccent: '#FFFFFF', border: '#D9C8BF' },
  beauty: { id: 'beauty', name: '莓果玫瑰', ink: '#33202D', muted: '#796574', background: '#FBF3F7', surface: '#FFFCFE', soft: '#F1DCE7', accent: '#8F3F68', onAccent: '#FFFFFF', border: '#DFC7D4' },
  spa: { id: 'spa', name: '森林鼠尾草', ink: '#203029', muted: '#617068', background: '#F2F6F1', surface: '#FCFEFC', soft: '#DDE8DE', accent: '#3F6B55', onAccent: '#FFFFFF', border: '#C9D7CC' },
  fitness: { id: 'fitness', name: '動能海軍藍', ink: '#17243A', muted: '#607087', background: '#F2F6FA', surface: '#FFFFFF', soft: '#DCE7F2', accent: '#245B91', onAccent: '#FFFFFF', border: '#C7D5E4' },
  creative: { id: 'creative', name: '藝廊鈷藍', ink: '#202033', muted: '#68677A', background: '#F4F3FA', surface: '#FFFFFF', soft: '#E4E1F3', accent: '#4A45A5', onAccent: '#FFFFFF', border: '#CFCCE4' },
  cleaning: { id: 'cleaning', name: '清新湖水綠', ink: '#153037', muted: '#5E7479', background: '#F0F8F8', surface: '#FCFFFF', soft: '#D7ECEB', accent: '#176B72', onAccent: '#FFFFFF', border: '#C3DDDC' },
  food: { id: 'food', name: '咖啡陶土', ink: '#32241C', muted: '#75645A', background: '#F9F3EA', surface: '#FFFDF9', soft: '#EEDFCB', accent: '#8A4932', onAccent: '#FFFFFF', border: '#DDCBB8' },
  service: { id: 'service', name: 'lihi 品牌藍', ink: '#1A1A5E', muted: '#666582', background: '#FFF5F8', surface: '#FFFFFF', soft: '#FFE0EA', accent: '#B82F67', onAccent: '#FFFFFF', border: '#E6CCD6' },
}

export function getIndustryPalette(industry: string): IndustryPalette {
  if (industry.includes('美髮')) return palettes.hair
  if (/美容|美甲|美睫/u.test(industry)) return palettes.beauty
  if (/按摩|SPA/u.test(industry)) return palettes.spa
  if (/健身|瑜伽|教練/u.test(industry)) return palettes.fitness
  if (/攝影|設計|工作室/u.test(industry)) return palettes.creative
  if (/清潔|維修/u.test(industry)) return palettes.cleaning
  if (/咖啡|甜點|餐飲|烘焙|飲料/u.test(industry)) return palettes.food
  return palettes.service
}

export function industryPaletteStyle(industry: string): string {
  const palette = getIndustryPalette(industry)
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
