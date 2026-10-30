# 秒創網站 MVP

輸入產業、品牌／網站名稱與三個優勢，AI 會生成繁體中文網站文案與 8 張一致風格的品牌影像，再讓使用者挑選五套版型、修改內容與準備發布。營業時間選填。

## 使用流程

1. 輸入產業、品牌名稱、三個優勢；營業時間選填。
2. AI 產出主標題、品牌介紹、三個優勢文案與 8 張品牌影像。
3. 系統預選 5 張影像套入五套響應式模板。
4. 使用者切換版型、修改文案、增減影像與補充聯絡資料。
5. 確認後銜接 lihiDomain 網域搜尋、結帳與發布。

AI 不得捏造地址、價格、獎項、創立年份或使用者未提供的服務。生成影像發布前必須由品牌確認人物、商品與場景符合實際情況。

## 已完成

- 品牌 brief 表單與完整欄位驗證
- Cloudflare Worker 串接 OpenAI Structured Outputs 與 Images API
- 8 張影像角色：主視覺、主理人、顧客、產品／服務、過程、空間、細節、門面
- 兩張並行生成、失敗訊息與上游錯誤隔離
- 8 張候選、預選 5 張、最多選 8 張
- 五套響應式模板與桌面／手機即時預覽
- 48 小時預覽、內容與影像編輯、lihiDomain 交接畫面

## 暫不包含

- AI 影像永久儲存與店家自有照片上傳
- lihiDomain 登入、網域搜尋、結帳、DNS、SSL 與正式發布
- 正式發布後的內容管理後台

## 開發與驗證

```bash
npm install
npm run dev
npm run check
```

## AI Worker

Worker 使用 server-side secret：

```bash
npx wrangler secret put OPENAI_API_KEY
npm run worker:deploy
```

可選環境變數：

- `OPENAI_TEXT_MODEL`：預設 `gpt-6-astra`
- `OPENAI_IMAGE_MODEL`：預設 `gpt-image-2.5-flare`
- `ALLOWED_ORIGINS`：允許呼叫 Worker 的前端 origins

部署後將 Worker origin 設為 GitHub repository variable `VITE_GENERATION_API_BASE_URL`。前端建置流程會讀取這個變數。

## API 契約

`POST /api/generate-content` 接收品牌 brief，回傳結構化文案、8 個影像 prompts 與 8 個 alt texts。

`POST /api/generate-image` 接收單張 prompt，回傳壓縮 JPEG data URL。前端以兩個並行工作逐張完成 8 張影像，避免單一長請求。
