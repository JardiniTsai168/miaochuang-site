# 秒創網站 MVP

給已有 Google 商家、但沒有官方網站的實體店家使用。店家貼上 Google 商家網址後，可確認資料、挑選照片與評論、修改智慧生成文案，並在三套固定模板中預覽單頁靜態形象網站。

## 已完成範圍

- Google 商家網址格式驗證
- 可替換的商家資料匯入介面；後端尚未提供時自動使用示範資料
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
- Google Places API 後端與照片資產落地儲存
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

實際串接時應由後端保護 `GOOGLE_MAPS_API_KEY`，使用官方 Places API，並將照片下載成可由正式靜態網站長期使用的自有資產；不可把 API key 或短效 Google Photo URL寫入發布後 HTML。
