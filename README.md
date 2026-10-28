# 秒創網站 MVP

給已有 Google 商家、但沒有官方網站的實體店家使用。店家貼上 Google 商家網址後，可確認資料、挑選照片與評論、修改智慧生成文案，並在五套固定模板中預覽單頁形象網站。

## 已完成範圍

- Google 商家網址格式驗證
- Cloudflare Worker 串接 Google Places API，支援真實商家資料即時匯入
- Google 照片由 Worker 即時串流，不轉存、不長期快取
- 照片作者、評論作者、原始內容與 Google Maps 來源歸屬
- 48 小時 localStorage 草稿
- 店家文字、服務、社群與短影音資料編輯
- 最多 3 次安全文案重生（目前為本地規則產生器）
- 照片與 Google 評論選擇
- 五套響應式模板：編輯誌、醒目海報、靜謐藝廊、手作菜單、影像拼貼
- 桌面／手機即時 `iframe srcDoc` 預覽
- 可在新分頁開啟完整純靜態 HTML
- 基礎 SEO、Open Graph、LocalBusiness JSON-LD
- lihiDomain 串接交接畫面

## 暫不包含

- lihiDomain 登入、網域搜尋、結帳、DNS、SSL 與正式部署
- Google Places 資料永久儲存或烘焙進正式靜態網站
- 真正的 LLM 文案 API
- 檔案上傳與正式發布

## 開發

```bash
npm install
npm run dev
```

預設網址：`http://localhost:4173`

## 驗證

```bash
npm run check
```

## Google Places Worker

Worker 使用兩個 server-side secrets：

```bash
npx wrangler secret put GOOGLE_MAPS_API_KEY
npx wrangler secret put PHOTO_SIGNING_SECRET
npm run worker:deploy
```

本地開發可用 `.dev.vars` 提供相同變數；該檔案不可提交。部署後，把 Worker origin 設為前端建置變數 `VITE_IMPORT_API_BASE_URL`。GitHub Pages workflow 會從同名 repository variable 讀取。

`ALLOWED_ORIGINS` 預設允許本機 Vite 預覽與正式 GitHub Pages origin；若網址改變，需同步更新 `wrangler.jsonc`。

### 內容使用邊界

- Places 內容只在目前工作階段即時取得與顯示，不寫入 localStorage、R2 或資料庫。
- API 圖片每次透過 Worker 即時取得，回應使用 `Cache-Control: no-store`。
- 預覽保留 Google Maps、照片作者、評論作者、個別內容來源與回報連結。
- 正式發布必須改用店家確認為自有的文字與自行上傳、具有發布權的照片；不可直接把 Places 內容永久發布。

## GitHub Pages

推送到 `main` 後，`.github/workflows/deploy.yml` 會自動執行測試、production build 並部署 `dist/`。

## Google 商家匯入契約

前端會呼叫：

```http
POST /api/import-place
Content-Type: application/json

{"sourceUrl":"https://maps.app.goo.gl/..."}
```

成功時回傳：

```json
{
  "mode": "live",
  "draft": "BusinessDraft"
}
```

API key 只存在 Cloudflare Worker secret。Places 內容不得下載成自有資產或永久寫入發布後 HTML；正式發布使用店家自有內容。
