# 秒創網站 v2

給台灣小型在地服務業使用的單頁網站生成器。使用者輸入產業、品牌名稱、三個優勢與至少一項主要服務，系統透過 OpenRouter 產生繁中文案、搭配共用授權圖庫，並套入五個可切換版型。

完整產品邊界見 [`PRODUCT_CONTRACT.md`](./PRODUCT_CONTRACT.md)。

## v2 流程

1. 輸入品牌 brief；營業時間選填。
2. OpenRouter 只依已提供事實改寫文案，不補造價格、地址、年資、證照、獎項、療效或服務。
3. 系統搭配 5 個圖片版位，使用者可逐張替換並在瀏覽器端最佳化。
4. 使用者切換五個版型、修改內容、預覽桌機與手機版。
5. 內部測試按鈕把目前版本建立或更新到共用 EmDash host。
6. 公開預覽保留 7 天、標記 `noindex`；正式登入、訂閱、付款與 Domain 購買後續由 lihi 系統接手。

## Repo 結構

- `src/`：Vite + React 生成與編輯介面。
- `worker/`：Cloudflare Worker，負責 OpenRouter 文案與 EmDash REST API 代理。
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
- `EMDASH_PUBLIC_URL`：公開網站 origin；未設定則沿用 `EMDASH_SITE_URL`
- `EMDASH_COLLECTION`：預設 `sites`
- `EMDASH_PUBLIC_PATH`：預設 `s`
- `ALLOWED_ORIGINS`：逗號分隔的前端 origins

## API

- `POST /api/generate-content`：接收品牌 brief，回傳主標題、品牌介紹與三個優勢。
- `POST /api/deploy-emdash`：首次建立 EmDash `sites` entry，之後更新同一 entry 並重新發布。
- `GET /health`：Worker health check。

## Production repo 邊界

本 repo 是上游開發來源。`weedgood/lihi-homepage` 僅透過 feature branch 與固定 commit 整合，不在本 repo 直接改 production `main` 或 workflows。
