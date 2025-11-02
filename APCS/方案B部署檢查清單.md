# 🚀 方案 B 部署與測試檢查清單

## 📋 部署前準備

### 1. 確認環境
- [ ] 已安裝 Node.js (v16+)
- [ ] 已有 Cloudflare 帳號
- [ ] 已有 GitHub 帳號
- [ ] 本地代碼已準備好

### 2. 檢查文件完整性
```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS

# 確認所有必要文件存在
ls -la web/scripts/api-client.js
ls -la web/scripts/course-access.js
ls -la web/scripts/secure-access.js
ls -la workers/auth-api.js
ls -la workers/schema.sql
ls -la web/pricing.html
ls -la web/unlock.html
```

---

## 🔧 步驟 1：安裝 Wrangler CLI

```bash
# 安裝 Wrangler
npm install -g wrangler

# 驗證安裝
wrangler --version

# 登入 Cloudflare
wrangler login
```

**預期結果：**
- ✅ 瀏覽器打開 Cloudflare 授權頁面
- ✅ 授權成功後顯示 "Successfully logged in"

---

## 🗄️ 步驟 2：創建 D1 數據庫

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 創建數據庫
wrangler d1 create apcs-course-db
```

**預期輸出：**
```
✅ Successfully created DB 'apcs-course-db'

[[d1_databases]]
binding = "DB"
database_name = "apcs-course-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要：複製並保存 database_id！**

### 初始化數據庫

```bash
# 執行 schema
wrangler d1 execute apcs-course-db --file=schema.sql
```

**預期結果：**
- ✅ 創建 `redemption_codes` 表
- ✅ 創建 `usage_logs` 表
- ✅ 插入 5 個測試兌換碼

### 驗證數據庫

```bash
# 查詢測試數據
wrangler d1 execute apcs-course-db --command="SELECT * FROM redemption_codes"
```

**預期輸出：**
```
┌────┬──────────────────┬──────┬──────┬─────────────────────┐
│ id │ code             │ plan │ used │ created_at          │
├────┼──────────────────┼──────┼──────┼─────────────────────┤
│ 1  │ APCS2024-DEMO01  │ full │ 0    │ 2024-11-02 14:00:00 │
│ 2  │ APCS2024-DEMO02  │ full │ 0    │ 2024-11-02 14:00:00 │
│ 3  │ APCS2024-DEMO03  │ full │ 0    │ 2024-11-02 14:00:00 │
│ 4  │ APCS2024-EARLY01 │ early│ 0    │ 2024-11-02 14:00:00 │
│ 5  │ APCS2024-EARLY02 │ early│ 0    │ 2024-11-02 14:00:00 │
└────┴──────────────────┴──────┴──────┴─────────────────────┘
```

- [ ] 確認看到 5 個兌換碼
- [ ] 所有 `used` 欄位都是 0

---

## 🔑 步驟 3：創建 KV 命名空間

```bash
# 創建 KV 命名空間
wrangler kv:namespace create "COURSE_ACCESS"
```

**預期輸出：**
```
✅ Success!
Add the following to your wrangler.toml:
{ binding = "COURSE_ACCESS", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**重要：複製並保存 KV namespace id！**

---

## ⚙️ 步驟 4：配置 wrangler.toml

在 `workers/` 目錄創建 `wrangler.toml`：

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
cat > wrangler.toml << 'EOF'
name = "apcs-auth-api"
main = "auth-api.js"
compatibility_date = "2024-01-01"

# D1 數據庫綁定
[[d1_databases]]
binding = "DB"
database_name = "apcs-course-db"
database_id = "填入你的 database_id"

# KV 綁定
[[kv_namespaces]]
binding = "COURSE_ACCESS"
id = "填入你的 KV namespace id"

# 環境變數
[vars]
ALLOWED_ORIGINS = "http://localhost:8000,https://apcs-space.pages.dev"
EOF
```

**檢查清單：**
- [ ] 已填入正確的 `database_id`
- [ ] 已填入正確的 KV `id`
- [ ] `ALLOWED_ORIGINS` 包含本地測試地址

---

## 🔐 步驟 5：設置密鑰

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 設置 JWT 密鑰
wrangler secret put JWT_SECRET
```

**提示：輸入一個強密碼，例如：**
```
apcs-2024-super-secret-jwt-key-change-this-in-production
```

**預期結果：**
- ✅ 顯示 "Creating the secret for the Worker"
- ✅ 顯示 "Success! Uploaded secret JWT_SECRET"

- [ ] JWT_SECRET 已設置

---

## 🚀 步驟 6：部署 Worker

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 部署
wrangler deploy
```

**預期輸出：**
```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded apcs-auth-api (x.xx sec)
Published apcs-auth-api (x.xx sec)
  https://apcs-auth-api.your-account.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**重要：複製並保存 Worker URL！**

- [ ] Worker 部署成功
- [ ] 已保存 Worker URL

---

## 🧪 步驟 7：測試 Worker API

### 測試 1：健康檢查

```bash
curl https://apcs-auth-api.your-account.workers.dev/api/health
```

**預期輸出：**
```json
{
  "status": "ok",
  "message": "APCS Auth API is running",
  "timestamp": "2024-11-02T14:00:00.000Z"
}
```

- [ ] 健康檢查通過

### 測試 2：驗證兌換碼

```bash
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO01"}'
```

**預期輸出：**
```json
{
  "valid": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "plan": "full",
  "message": "解鎖成功！"
}
```

- [ ] 兌換碼驗證成功
- [ ] 返回 JWT token
- [ ] plan 為 "full"

### 測試 3：驗證 Token

```bash
# 使用上一步獲得的 token
TOKEN="填入上一步的 token"

curl -X POST https://apcs-auth-api.your-account.workers.dev/api/verify-token \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}"
```

**預期輸出：**
```json
{
  "valid": true,
  "plan": "full",
  "code": "APCS2024-DEMO01"
}
```

- [ ] Token 驗證成功

### 測試 4：檢查兌換碼已使用

```bash
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM redemption_codes WHERE code='APCS2024-DEMO01'"
```

**預期結果：**
- `used` 欄位應該變成 `1`
- `used_at` 應該有時間戳

- [ ] 兌換碼狀態已更新

### 測試 5：重複使用兌換碼（應該失敗）

```bash
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO01"}'
```

**預期輸出：**
```json
{
  "valid": false,
  "message": "此兌換碼已被使用"
}
```

- [ ] 重複使用被正確拒絕

### 測試 6：無效兌換碼

```bash
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"INVALID-CODE"}'
```

**預期輸出：**
```json
{
  "valid": false,
  "message": "無效的兌換碼"
}
```

- [ ] 無效兌換碼被正確拒絕

---

## 🌐 步驟 8：部署 Cloudflare Pages

### 推送代碼到 GitHub

```bash
cd /Users/yen-tangchang/Documents/github/FAE
git add -A
git commit -m "準備部署到 Cloudflare Pages"
git push origin feature/apcs-space-exploration
```

### 在 Cloudflare Dashboard 設置

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇 **Pages** → **Create a project**
3. 連接 GitHub 帳號
4. 選擇 repository: `FAE`
5. 配置構建設置：
   ```
   Framework preset: None
   Build command: (留空)
   Build output directory: /
   Root directory: APCS/web
   Branch: feature/apcs-space-exploration
   ```
6. 點擊 **Save and Deploy**

**預期結果：**
- ✅ 部署成功
- ✅ 獲得 URL：`https://apcs-space.pages.dev`（或類似）

- [ ] Pages 部署成功
- [ ] 已保存 Pages URL

---

## 🔗 步驟 9：連接 Pages 和 Workers

### 更新前端 API 端點

編輯 `web/scripts/api-client.js`：

```javascript
// 替換為你的 Worker URL
const API_BASE_URL = 'https://apcs-auth-api.your-account.workers.dev';
```

### 更新 CORS 設置

編輯 `workers/wrangler.toml`，更新 `ALLOWED_ORIGINS`：

```toml
[vars]
ALLOWED_ORIGINS = "https://apcs-space.pages.dev,http://localhost:8000"
```

### 重新部署

```bash
# 重新部署 Worker
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler deploy

# 推送前端更新
cd /Users/yen-tangchang/Documents/github/FAE
git add -A
git commit -m "更新 API 端點"
git push
```

- [ ] API 端點已更新
- [ ] CORS 已配置
- [ ] 已重新部署

---

## ✅ 步驟 10：端到端測試

### 測試 1：訪問網站

```
https://apcs-space.pages.dev
```

**檢查：**
- [ ] 網站正常載入
- [ ] 看到課程列表
- [ ] A1, A2, A3 可以訪問
- [ ] B1, B2, C1, C2, D1, E1 顯示鎖定

### 測試 2：測試定價頁面

```
https://apcs-space.pages.dev/pricing.html
```

**檢查：**
- [ ] 定價頁面正常顯示
- [ ] 3 個方案卡片正確
- [ ] 按鈕可點擊

### 測試 3：測試兌換碼解鎖

```
https://apcs-space.pages.dev/unlock.html
```

**步驟：**
1. 輸入兌換碼：`APCS2024-DEMO02`
2. 點擊「驗證兌換碼」

**預期結果：**
- [ ] 顯示「驗證中...」
- [ ] 顯示「解鎖成功！」
- [ ] 自動跳轉到首頁
- [ ] B1-E1 課程已解鎖

### 測試 4：驗證課程訪問

**訪問付費課程：**
```
https://apcs-space.pages.dev/lessons/L2/B1.html
```

**檢查：**
- [ ] 可以正常訪問
- [ ] 內容完整顯示
- [ ] 沒有付費牆彈出

### 測試 5：清除 localStorage 測試

1. 打開瀏覽器開發者工具
2. Application → Local Storage → 清除所有
3. 重新載入首頁

**預期結果：**
- [ ] B1-E1 重新鎖定
- [ ] A1-A3 仍可訪問

### 測試 6：重新解鎖測試

1. 訪問 unlock.html
2. 輸入：`APCS2024-DEMO03`
3. 驗證

**預期結果：**
- [ ] 成功解鎖
- [ ] 課程再次可訪問

---

## 📊 步驟 11：監控與分析

### 查看 Worker 日誌

```bash
# 實時查看日誌
wrangler tail
```

**測試：**
1. 在另一個終端訪問 API
2. 觀察日誌輸出

- [ ] 日誌正常顯示
- [ ] 可以看到請求記錄

### 查看 D1 使用記錄

```bash
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM usage_logs ORDER BY used_at DESC LIMIT 10"
```

**預期結果：**
- [ ] 看到使用記錄
- [ ] 包含 IP、時間戳等信息

### Cloudflare Dashboard 分析

1. Workers → apcs-auth-api → **Metrics**
   - [ ] 查看請求數
   - [ ] 查看錯誤率
   - [ ] 查看響應時間

2. Pages → 你的項目 → **Analytics**
   - [ ] 查看訪問量
   - [ ] 查看地理分布

---

## 🔐 步驟 12：安全性驗證

### 測試 CORS 保護

```bash
# 從未授權的來源發送請求
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Origin: https://evil-site.com" \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO04"}'
```

**預期結果：**
- [ ] 請求被拒絕或沒有 CORS 頭

### 測試 Token 過期

1. 獲取一個 token
2. 等待 24 小時（或修改 Worker 代碼縮短過期時間測試）
3. 使用過期 token 驗證

**預期結果：**
- [ ] 過期 token 被拒絕

### 測試 SQL 注入防護

```bash
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO01 OR 1=1"}'
```

**預期結果：**
- [ ] 請求被安全處理
- [ ] 沒有數據洩漏

---

## 💰 步驟 13：成本監控

### 查看免費額度使用情況

1. Cloudflare Dashboard → **Workers & Pages** → **Plans**
2. 查看當前用量：
   - [ ] Workers 請求數
   - [ ] D1 讀寫次數
   - [ ] KV 操作次數

### 設置用量告警

1. Workers → apcs-auth-api → **Triggers** → **Alerts**
2. 設置告警：
   - [ ] 請求數 > 80,000/天
   - [ ] 錯誤率 > 5%

---

## 📝 完成檢查清單總結

### 基礎設施
- [ ] Wrangler CLI 已安裝
- [ ] D1 數據庫已創建並初始化
- [ ] KV 命名空間已創建
- [ ] JWT_SECRET 已設置
- [ ] Worker 已部署
- [ ] Pages 已部署

### API 功能
- [ ] 健康檢查正常
- [ ] 兌換碼驗證正常
- [ ] Token 生成正常
- [ ] Token 驗證正常
- [ ] 重複使用防護正常
- [ ] 無效碼拒絕正常

### 前端整合
- [ ] API 端點已配置
- [ ] CORS 已設置
- [ ] 兌換頁面正常
- [ ] 課程訪問控制正常
- [ ] localStorage 管理正常

### 安全性
- [ ] CORS 保護正常
- [ ] Token 過期機制正常
- [ ] SQL 注入防護正常
- [ ] 使用記錄正常

### 監控
- [ ] Worker 日誌可查看
- [ ] D1 記錄可查詢
- [ ] Analytics 可訪問
- [ ] 告警已設置

---

## 🎉 部署成功！

如果所有檢查項都通過，恭喜你！方案 B 已經完全部署並正常運作。

### 下一步

1. **生產環境優化**
   - 設置自定義域名
   - 配置 CDN 快取策略
   - 添加更多兌換碼

2. **功能擴展**
   - 整合支付系統
   - 添加郵件通知
   - 創建管理儀表板

3. **持續監控**
   - 每週檢查用量
   - 分析用戶行為
   - 優化性能

---

## 🆘 故障排除

### 問題 1：Worker 部署失敗

**錯誤：** `Error: Missing required field: database_id`

**解決：**
```bash
# 檢查 wrangler.toml
cat wrangler.toml
# 確認 database_id 已正確填入
```

### 問題 2：CORS 錯誤

**錯誤：** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解決：**
1. 檢查 `wrangler.toml` 中的 `ALLOWED_ORIGINS`
2. 確認包含你的 Pages URL
3. 重新部署 Worker

### 問題 3：Token 驗證失敗

**錯誤：** `Invalid token`

**解決：**
```bash
# 檢查 JWT_SECRET 是否設置
wrangler secret list

# 如果沒有，重新設置
wrangler secret put JWT_SECRET
```

### 問題 4：數據庫查詢失敗

**錯誤：** `D1_ERROR: no such table: redemption_codes`

**解決：**
```bash
# 重新執行 schema
wrangler d1 execute apcs-course-db --file=schema.sql
```

---

## 📞 需要幫助？

如果遇到問題：
1. 查看 Worker 日誌：`wrangler tail`
2. 檢查 D1 數據：`wrangler d1 execute apcs-course-db --command="SELECT * FROM redemption_codes"`
3. 參考 Cloudflare 文檔：https://developers.cloudflare.com/
