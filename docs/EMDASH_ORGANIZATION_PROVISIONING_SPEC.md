# 秒創網站：組織級 EmDash 多站部署工程規格

Status: Approved product direction / Engineering handoff  
Updated: 2026-11-13  
Scope: lihi checkout backend、秒創網站 handoff、provisioning service、Cloudflare／EmDash、lihi 管理後台

## 1. 目標

正式付費部署改為：**一個 lihi 帳號／組織一套獨立 EmDash，同一套後台可管理該組織的多個網站與不同網域。**

必須同時滿足：

1. 測試／公共網址部署全部使用平台共用的 EmDash 後台，不替測試使用者建立帳號。
2. 使用者第一次買網域並完成正式部署時，建立該帳號／組織專屬的 EmDash runtime、後台及管理員。
3. 同一組織部署第二個以上網站時，沿用同一套 EmDash 後台，只新增網站與網域。
4. lihi 後台左側 menu 新增「網站管理」，讓使用者進入自己的 EmDash 後台。
5. lihi 可選擇串接 EmDash 自動登入；第一版若不串，自首次部署完成後寄送後台入口、帳號及安全的密碼設定方式。

## 2. 非目標

- 不將公共測試 EmDash 開放給終端使用者登入。
- 不讓不同 lihi 組織共用同一個付費 EmDash runtime、D1 或管理員。
- 不以 thank-you page、瀏覽器 query string 或前端 callback 判斷付款成功。
- 第一版不做「同一組織成員只能管理特定網站」；組織內管理員預設可管理該 EmDash 的全部網站。
- 不在 Email 傳送永久明碼密碼。

## 3. 核心名詞

- `organization_id`：lihi backend 產生的不可變組織識別。若 lihi 現階段只有個人帳號，可先用 backend 端的 `account:{user_id}` 作為組織鍵；不得由瀏覽器自行傳入。
- `runtime_id`：一套組織專屬 EmDash runtime，包含 Worker、D1、Session KV、媒體儲存與管理員。
- `site_id`：runtime 內不可變的網站識別；slug、品牌名稱與網域變更時不可更換。
- `handoff_id`：公共 EmDash 內尚未發布的秒創草稿識別。
- `domain_binding`：一個已驗證網域到 `site_id` 的唯一映射。

## 4. 部署模型

### 4.1 測試／公共網址

- 所有測試連結使用目前同一個公共 EmDash 後台及 `sites` collection。
- 公開路徑維持 `/s/{slug}`，內容標記 `noindex, nofollow, noarchive`，依產品規則到期。
- 測試資料不得建立 lihi 組織 runtime、Custom Domain 或使用者管理員。
- 公共 EmDash 僅供 lihi 內部管理；終端使用者不可看到其他測試站資料。

### 4.2 正式付費網站

- 第一次成功付款：建立組織 runtime、第一個 `site_id`、第一個 Custom Domain 與 EmDash 管理員。
- 第二個以上網站：以 `organization_id` 找到既有 `runtime_id`，建立新 `site_id`、匯入新的 handoff、建立新 domain binding；不得再次建立 Worker、D1、KV 或管理員。
- 每個網站的內容、媒體、發布狀態、SEO 與網域設定均以 `site_id` 隔離。
- 公開 runtime 依 HTTP hostname 查找唯一 `site_id`；不得只依 slug 或 Host header 未驗證字串直接載入內容。
- 同一網域同一時間只能綁定一個 active `site_id`。

## 5. 系統責任邊界

### 秒創網站（本 repo）

- 建立／更新公共 EmDash 的 draft handoff。
- 將 `handoff_id` 放入 lihi checkout source：`miaochuang:{handoff_id}`。
- 維護 EmDash seed、網站 renderer 與 handoff 欄位映射。
- 不持有 lihi 使用者身份、付款狀態或 Cloudflare account provisioning secret。

### lihi checkout backend

- 以已登入 session 決定可信任的 `organization_id`、`user_id` 與 Email。
- 驗證 invoice 已付款、網域購買成功且 source 格式正確。
- 發送具簽章的 provisioning webhook。
- 在 lihi 後台提供「網站管理」入口及 runtime 狀態。

### Provisioning service

- 驗證 webhook 簽章、timestamp、invoice、網域及 handoff。
- 以 `organization_id` find-or-create runtime。
- 建立或重用 EmDash runtime，匯入網站、發布內容、綁定網域。
- 保存 idempotency、狀態、錯誤與稽核紀錄。
- 觸發管理員邀請／密碼設定 Email。

### 組織 EmDash runtime

- 管理該組織所有 `sites` records 與媒體。
- 後台登入後可查看該組織全部網站；P0 可直接使用 EmDash 的網站 collection list，P1 再增加品牌化網站切換器。
- 根據 hostname 載入正確網站。

## 6. Provisioning webhook contract

### Endpoint

`POST /internal/provisioning/emdash/sites`

### Required headers

- `Content-Type: application/json`
- `X-Lihi-Timestamp: <unix-seconds>`
- `X-Lihi-Event-Id: <uuid>`
- `X-Lihi-Signature: v1=<hex-hmac-sha256>`

簽章內容：`{timestamp}.{raw_request_body}`。允許時間差最多 5 分鐘；event id 與 invoice id 都必須具 idempotency。

### Payload

```json
{
  "event": "miaochuang.site.paid",
  "event_id": "evt_01...",
  "invoice_id": "inv_01...",
  "organization_id": "org_01...",
  "purchaser": {
    "user_id": "usr_01...",
    "email": "owner@example.com",
    "display_name": "王小明"
  },
  "handoff_id": "emdash-content-id",
  "domain": "example.com",
  "paid_at": "2026-11-13T02:00:00+08:00"
}
```

`organization_id`、`user_id`、Email、invoice 與付款狀態只能由 lihi backend 從 authenticated account／訂單資料產生，不接受瀏覽器覆寫。

### Response

- 首次接收或已排入工作：`202 { "job_id": "...", "status": "queued" }`
- 同一 invoice 已完成：`200 { "job_id": "...", "status": "ready", "site_id": "..." }`
- 簽章無效：`401`
- payload／網域／handoff 不合法：`400`
- 同一網域已綁定其他組織：`409`

Webhook 回應不得等待完整 Cloudflare provisioning；長流程交由 queue／job worker 執行。

## 7. Provisioning state machine

`queued → runtime_provisioning → runtime_ready → content_importing → domain_binding → ready`

失敗狀態：`failed_retryable`、`failed_manual_review`。

規則：

- 同一 `invoice_id` 重送不得建立第二個網站。
- 同一組織同時首次購買兩站時，必須以 `organization_id` 加鎖，最多建立一個 runtime。
- 每個可重試步驟需可安全重跑；已存在的 Worker、database、collection、site 或 domain binding 視為成功，不重複建立。
- 重試採指數退避，超過上限進入人工處理佇列並通知內部。

## 8. Provisioning registry

Registry 應存放於 lihi backend 或獨立 provisioning database，不放在公共 EmDash：

### `emdash_runtimes`

- `runtime_id`
- `organization_id` unique
- `worker_name`
- `admin_url`
- `status`
- `cloudflare_account_id`（可加密／reference）
- `created_at`、`updated_at`

### `emdash_sites`

- `site_id`
- `runtime_id`
- `organization_id`
- `handoff_id`
- `invoice_id` unique
- `domain` unique
- `emdash_entry_id`
- `status`
- `created_at`、`updated_at`

### `provisioning_jobs`

- `job_id`
- `event_id` unique
- `invoice_id` unique
- `organization_id`
- `site_id` nullable
- `state`
- `attempt_count`
- `last_error_code`（不得存 secret 或完整 token）
- `created_at`、`updated_at`、`completed_at`

## 9. 組織 EmDash 的網站資料必要欄位

現有內容欄位之外，正式 runtime 的 `sites` collection 至少新增：

- `site_id`：required、immutable、unique
- `primary_domain`：required、normalized、unique within platform
- `site_status`：`draft | provisioning | published | suspended`
- `source_handoff_id`
- `source_invoice_id`
- `published_at`

媒體儲存 key 必須帶 `site_id/` prefix。刪除網站時只能刪該 prefix，不得掃除整個組織 bucket。

## 10. 首次部署流程

1. 秒創網站在公共 EmDash 建立 unpublished handoff。
2. 使用者前往 lihi 搜尋並購買網域。
3. lihi backend 完成付款與網域確認，依登入身份取得 `organization_id`。
4. lihi backend 發送 signed webhook。
5. Provisioner 以 `organization_id` 加鎖並建立組織 EmDash runtime。
6. 建立組織 owner 管理員；產生一次性密碼設定／邀請 token。
7. 在組織 EmDash 建立網站並匯入 handoff 的結構化內容與媒體。
8. 發布網站並建立 hostname → `site_id` binding。
9. 確認 HTTPS、首頁 HTTP 200、正確 hostname、無 `noindex`，再標記 `ready`。
10. 通知 lihi backend；寄送後台啟用 Email。

任何一步失敗前，使用者不可看到「部署完成」。

## 11. 第二站以上流程

1. webhook 帶入相同 `organization_id` 與新的 invoice、handoff、domain。
2. Provisioner 找到既有 ready runtime；不得建立第二套 runtime 或第二個 owner。
3. 建立新的 `site_id` 與 EmDash entry，匯入內容、建立媒體 prefix、發布並綁定新網域。
4. 新網站出現在同一 EmDash 後台的網站列表。
5. 不重寄初始密碼；可寄「新網站已加入」通知與既有後台入口。

## 12. lihi 後台「網站管理」

### Menu

- lihi 後台左側 menu 新增「網站管理」。
- 只對已有 EmDash runtime 或正在 provisioning 的組織顯示；也可對所有使用者顯示 empty state 與「建立網站」CTA，由產品決定。

### 狀態

- 無 runtime：顯示尚未建立網站與前往秒創網站 CTA。
- Provisioning 中：顯示「網站建立中」，不可重複觸發 provisioning。
- Ready：進入該組織的 EmDash 後台。
- Failed：顯示可理解的錯誤與聯絡客服；內部提供 retry，不將 Cloudflare error 直接暴露給使用者。

### Option A — lihi 自動登入（建議 P1）

1. 使用者點擊「網站管理」。
2. lihi backend 確認 session 與 `organization_id`，產生 60 秒有效、單次使用的 signed login assertion。
3. Browser 導向組織 EmDash 的 `/auth/lihi/callback?token=...`。
4. EmDash 驗證 issuer、audience、expiry、nonce、organization 與 signature，建立自己的短效 session 後立即作廢 assertion。

禁止把 lihi session cookie 分享給 EmDash，也禁止 token 放在可長期保存的 URL 或 analytics log。

### Option B — 不串自動登入（建議 P0）

- 「網站管理」直接開啟組織 EmDash `admin_url` 的登入頁。
- 首次部署完成後寄送：後台網址、管理員帳號、一次性設定密碼連結。
- 一次性連結建議 24 小時內有效、只能使用一次；過期可從 lihi 後台重新寄送。
- 若工程限制必須寄臨時密碼：密碼需隨機產生、短期失效、首次登入強制更換，server 不得保存可還原明碼。永久明碼密碼不得透過 Email 傳送。
- 第二站以上沿用同一帳號，不再寄初始帳密。

## 13. Email 規格（P0）

Subject：`你的秒創網站後台已建立`

內容必須包含：

- 組織／帳號名稱
- 已部署網站與正式網域
- EmDash 後台入口
- 管理員 Email
- 「設定密碼」一次性按鈕
- 連結有效期限及過期後的重寄方式
- 客服入口

Email 不得包含 API token、Cloudflare identifier、D1／KV 資訊或永久明碼密碼。

## 14. Security requirements

- Cloudflare API token、EmDash bootstrap secret、Email provider key 只存在 secret store。
- webhook 使用 HMAC 或 asymmetric signature；secret 必須可輪替並支援雙 key 過渡。
- 所有 admin URL 強制 HTTPS；session cookie 使用 `Secure`、`HttpOnly`、`SameSite=Lax/Strict`。
- 所有 domain 在綁定前須確認屬於已付款訂單，並防止綁定平台／管理後台保留網域。
- 日誌可記 `organization_id`、`site_id`、invoice、job state；不得記 token、密碼、完整簽章或 Email 內容。
- 刪除組織與網站需分開：刪網站不可刪 runtime；刪最後一站也不自動刪 runtime，須另走終止訂閱／資料保留流程。

## 15. Observability 與營運

每個 provisioning job 至少記錄：

- `event_id`、`invoice_id`、`organization_id`、`site_id`、`runtime_id`
- state transition 與耗時
- Cloudflare／EmDash 操作的 normalized error code
- Email delivery id（不記信件密碼或 token）

內部需要：

- 依 invoice、organization、domain 查詢 job
- retry retryable job
- 重寄管理員邀請
- 查看 domain binding 狀態
- 將網站 suspend／resume

## 16. 驗收條件

### 公共測試

- 連續建立兩個公共預覽，兩者出現在同一公共 EmDash 後台。
- 兩個公開連結 HTTP 200、內容不同、皆有 `noindex`，且不建立組織 runtime。

### 首次付費部署

- 一筆已付款 invoice 只建立一套 runtime、一個網站與一個 domain binding。
- 重送相同 webhook 不產生重複 runtime／site／domain。
- 正式網域 HTTP 200、HTTPS 正常、顯示正確內容且沒有預覽 `noindex`。
- lihi「網站管理」能到正確 EmDash；P0 能登入，P1 自動登入 assertion 只能使用一次。
- 使用者收到一次性設定密碼 Email；token 過期與重寄流程正常。

### 第二站

- 相同 `organization_id` 的第二筆付款重用原 runtime。
- EmDash 後台顯示兩個網站，各自網域載入正確內容與媒體。
- 修改站 A 不影響站 B；刪除站 A 媒體不刪除站 B prefix。
- 第二站不建立新管理員、不重寄初始密碼。

### 隔離與錯誤

- 不同 `organization_id` 不可透過網站 ID、slug、domain 或 SSO assertion 存取彼此後台或資料。
- 同網域重複綁定回 `409`，不覆蓋現有網站。
- Cloudflare／EmDash／Email 暫時失敗可重試且不製造重複資源。
- 無效簽章、過期 timestamp、偽造 `organization_id` 與未付款 invoice 全部拒絕。

## 17. 建議實作順序

### P0 — 可正式營運、無 SSO

1. lihi checkout backend 補 signed webhook 與可信任 `organization_id`。
2. 建立 provisioning registry、queue、idempotency 與組織鎖。
3. 將 EmDash runtime template 改為多站 hostname routing 與 `site_id` 媒體隔離。
4. 實作首次／後續站 provisioning 與 Custom Domain。
5. lihi 後台新增「網站管理」，先連到 EmDash login。
6. 串 Email 邀請／一次性設定密碼。
7. 完成首次、重送、第二站、跨組織、失敗重試 E2E。

### P1 — lihi 自動登入

1. 定義 lihi → EmDash signed assertion key rotation。
2. 實作 `/auth/lihi/callback` 與 nonce store。
3. lihi「網站管理」改走一次性 SSO redirect。
4. 補登入撤銷、過期、重放與跨組織測試。

## 18. 尚待工程確認

- 實際處理 `/ajax/checkout/tappay` 與登入 session 的 lihi backend repo／owner。
- lihi 是否已有穩定 `organization_id`；若無，先以 account 建立 organization mapping。
- Provisioning registry 要放 lihi backend database 或獨立 service database。
- 任意客戶網域採 Workers Custom Domains 或 Cloudflare for SaaS Custom Hostnames。
- Email provider、寄件網域與客服入口。
- EmDash 是否能直接加外部 SSO callback；若需 fork，需固定 upstream commit 並保留升級策略。

以上未決項不影響 P0 contract：可信任組織身份、idempotent provisioning、多站資料隔離、lihi「網站管理」及安全帳號交付皆為必做。
