const MAX_EDGE = 2000

export async function optimizeImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('請選擇圖片檔案。')
  if (file.size > 20 * 1024 * 1024) throw new Error('圖片需小於 20MB。')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('瀏覽器無法處理這張圖片。')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84))
  if (!blob) throw new Error('圖片最佳化失敗，請換一張圖片。')
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(new Error('圖片讀取失敗。')))
    reader.readAsDataURL(blob)
  })
}
