# 秒創網站 v2

給台灣小型在地服務業使用的單頁網站生成器。使用者輸入產業、品牌名稱、三個優勢與至少一項主要服務，系統透過 OpenRouter 產生繁中文案、搭配共用授權圖庫，並套入五個可切換版型。

正式工具入口為 `https://lihi.io/tools/MeowSite/`。前端以完整 web app 形式由
lihi tools Worker 代理；`miaochuang-v2` Worker 是上游服務，不作為對外網址。

一般 `npm run build` 使用相對靜態資源路徑，讓同一份輸出可同時在 Worker 根目錄
與 `/tools/MeowSite/` 運作。需要固定子路徑輸出時可執行 `npm run build:lihi-tools`。

完整產品邊界見 [`PRODUCT_CONTRACT.md`](./PRODUCT_CONTRACT.md)。

## v2 流程

1. 輸入品牌 brief；營業時間選填。
2. OpenRouter 只依已提供事實改寫文案，不補造價格、地址、年資、證照、獎項、療效或服務。
3. 系統搭配 5 個圖片版位，使用者可逐張替換並在瀏覽器端最佳化。
4. 使用者切換五個版型、修改內容、預覽桌機與手機版。
5. 使用者選擇品牌網域後，先依品牌名稱取得 3 個網域建議，再前往 lihi 查詢與購買；系統同時保存不可公開的品牌 handoff。
6. lihi 付款成功事件透過簽章 webhook 啟動正式 provisioning；完成後才建立專屬網站與 EmDash 後台。
7. 公開預覽保留 30 天並標記 `noindex`；未付款的 handoff 不會發布成正式網站。

## Repo 結構

- `src/`：Vite + React 生成與編輯介面。
- `worker/`：Cloudflare Worker，負責 OpenRouter 文案與網域購買前的品牌 handoff。
- `emdash-site/`：官方 EmDash Cloudflare template 衍生的共用 host，使用 D1 + R2。
- `scripts/visual-check.mjs`：桌機／手機與五版型視覺回歸。

## 本地驗證

```bash
npm install
npm run check
npm run emdash:build
npm run visual-check
```

## Generation Worker secrets

不得把 secrets 放進 repo。使用 Wrangler 設定：

```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put EMDASH_API_TOKEN
```

可選 vars / secrets：

- `OPENROUTER_TEXT_MODEL`：預設 `qwen/qwen3.5-plus-02-15`
- `OPENROUTER_FALLBACK_MODEL`：主模型失敗時唯一備援
- `PUBLIC_APP_URL`：OpenRouter attribution URL
- `EMDASH_SITE_URL`：EmDash REST API origin
- `EMDASH_COLLECTION`：預設 `sites`
- `LIHI_DOMAIN_SEARCH_URL`：預設 `https://lihi.io/go/search`
- `ALLOWED_ORIGINS`：逗號分隔的前端 origins

## API

- `POST /api/generate-content`：接收品牌 brief，回傳主標題、品牌介紹與三個優勢。
- `POST /api/brand-checkout`：建立或更新未發布的品牌 handoff，回傳帶關聯 ID 的 lihi 網域購買網址。
- `POST /api/domain-suggestions`：依品牌名稱產生 3 個網域建議；測試期間 `DOMAIN_SUGGESTION_LIMIT_ENABLED=false` 為無限次，恢復限制時由 Durable Object 依 IP 雜湊計數最多 5 次。
- `GET /health`：Worker health check。

付款成功不能由瀏覽器回傳值判定。處理 `/ajax/checkout/tappay` 的 lihi backend 必須在 invoice 已付款且網域購買成立後，將 `source=miaochuang:<handoffId>` 以簽章 webhook 傳給 provisioning service；該 service 需做簽章驗證與 invoice idempotency，才可建立專屬 EmDash runtime 並匯入 handoff。

## Production repo 邊界

本 repo 是上游開發來源。`weedgood/lihi-homepage` 僅透過 feature branch 與固定 commit 整合，不在本 repo 直接改 production `main` 或 workflows。
