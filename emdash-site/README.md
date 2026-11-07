# 秒創網站 EmDash Host

共用的 Cloudflare EmDash 發布站台，由官方 `marketing-cloudflare` template 精簡而來。

## 資料模型

`sites` collection 儲存：

- 品牌／店家名稱
- 五個版型其中一種
- 已產生的完整 HTML
- 7 天預覽到期時間

公開網址為 `/s/{slug}`。內容到期後回傳 HTTP `410`，所有回應都帶 `noindex, nofollow, noarchive`。

## 指令

```bash
pnpm install
pnpm build
pnpm wrangler login
pnpm wrangler deploy
```

首次請求會建立 D1 schema 並進入 EmDash setup wizard。建立管理員後，從 EmDash 產生具備 content read/write/publish scope 的 API Token，再以 secret 設到上游 generation Worker 的 `EMDASH_API_TOKEN`。
