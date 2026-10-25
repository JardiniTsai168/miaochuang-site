import type { BusinessDraft } from '../types'

const variants = [
  {
    tagline: (draft: BusinessDraft) => `讓每一次到訪，都從喜歡開始`,
    description: (draft: BusinessDraft) =>
      `${draft.name}專注於${draft.services.slice(0, 2).join('與') || draft.category}。我們把每個細節準備好，期待在${draft.address.split('市')[0] || '這座城市'}與你見面。`,
  },
  {
    tagline: (draft: BusinessDraft) => `${draft.category.split('・')[0]}，也可以很有自己的樣子`,
    description: (draft: BusinessDraft) =>
      `在${draft.name}，你可以自在感受${draft.services.join('、') || '我們用心準備的服務'}。從空間到體驗，都希望成為你願意再次回來的理由。`,
  },
  {
    tagline: (draft: BusinessDraft) => `今天，就來認識 ${draft.name}`,
    description: (draft: BusinessDraft) =>
      `${draft.name}位於${draft.address}，提供${draft.services.join('、') || draft.category}。查看營業資訊與真實評論，安排你的下一次到訪。`,
  },
]

export function regenerateCopy(draft: BusinessDraft): BusinessDraft {
  const variant = variants[draft.regenerationCount % variants.length]
  return {
    ...draft,
    tagline: variant.tagline(draft),
    description: variant.description(draft),
    regenerationCount: draft.regenerationCount + 1,
  }
}
