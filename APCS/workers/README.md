# 🚀 APCS 課程系統 - Workers API

這個目錄包含 Cloudflare Workers 認證 API 的所有代碼和部署腳本。

## 📁 文件說明

```
workers/
├── auth-api.js       # Workers API 主程式
├── schema.sql        # D1 數據庫 Schema
├── deploy.sh         # 自動部署腳本
├── test-api.sh       # API 測試腳本
├── wrangler.toml     # Wrangler 配置文件（需要創建）
└── README.md         # 本文件
```

## 🚀 快速開始

### 方法 1：使用自動部署腳本（推薦）

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 執行部署腳本
./deploy.sh
```

腳本會引導你完成：
1. ✅ 安裝 Wrangler CLI
2. ✅ 登入 Cloudflare
3. ✅ 創建 D1 數據庫
4. ✅ 創建 KV 命名空間
5. ✅ 配置 wrangler.toml
6. ✅ 初始化數據庫
7. ✅ 設置 JWT 密鑰
8. ✅ 部署 Worker
9. ✅ 測試 API

### 方法 2：手動部署

詳細步驟請參考：`../方案B部署檢查清單.md`

## 🧪 測試 API

部署完成後，使用測試腳本驗證所有功能：

```bash
# 測試 API（會提示輸入 Worker URL）
./test-api.sh

# 或直接指定 URL
./test-api.sh https://apcs-auth-api.your-account.workers.dev
```

測試項目包括：
- ✅ 健康檢查
- ✅ 驗證有效兌換碼
- ✅ Token 生成和驗證
- ✅ 重複使用防護
- ✅ 無效碼拒絕
- ✅ 錯誤處理

## 📊 API 端點

### 1. 健康檢查

```bash
GET /api/health
```

**響應：**
```json
{
  "status": "ok",
  "message": "APCS Auth API is running",
  "timestamp": "2024-11-02T14:00:00.000Z"
}
```

### 2. 驗證兌換碼

```bash
POST /api/validate-code
Content-Type: application/json

{
  "code": "APCS2024-DEMO01"
}
```

**成功響應：**
```json
{
  "valid": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "plan": "full",
  "message": "解鎖成功！"
}
```

**失敗響應：**
```json
{
  "valid": false,
  "message": "無效的兌換碼"
}
```

### 3. 驗證 Token

```bash
POST /api/verify-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功響應：**
```json
{
  "valid": true,
  "plan": "full",
  "code": "APCS2024-DEMO01"
}
```

## 🗄️ 數據庫管理

### 查詢兌換碼

```bash
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM redemption_codes"
```

### 查詢使用記錄

```bash
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM usage_logs ORDER BY used_at DESC LIMIT 10"
```

### 添加新兌換碼

```bash
wrangler d1 execute apcs-course-db \
  --command="INSERT INTO redemption_codes (code, plan) VALUES ('APCS2024-NEW01', 'full')"
```

### 重置兌換碼（測試用）

```bash
wrangler d1 execute apcs-course-db \
  --command="UPDATE redemption_codes SET used = 0, used_at = NULL WHERE code = 'APCS2024-DEMO01'"
```

## 📝 日誌查看

### 實時日誌

```bash
wrangler tail
```

### 查看特定時間的日誌

```bash
wrangler tail --since 1h
```

## 🔧 配置說明

### wrangler.toml

```toml
name = "apcs-auth-api"
main = "auth-api.js"
compatibility_date = "2024-01-01"

# D1 數據庫綁定
[[d1_databases]]
binding = "DB"
database_name = "apcs-course-db"
database_id = "你的數據庫ID"

# KV 綁定
[[kv_namespaces]]
binding = "COURSE_ACCESS"
id = "你的KV命名空間ID"

# 環境變數
[vars]
ALLOWED_ORIGINS = "https://apcs-space.pages.dev,http://localhost:8000"
```

### 環境變數

| 變數名 | 說明 | 設置方式 |
|--------|------|----------|
| `JWT_SECRET` | JWT 簽名密鑰 | `wrangler secret put JWT_SECRET` |
| `ALLOWED_ORIGINS` | 允許的 CORS 來源 | 在 `wrangler.toml` 中設置 |

## 🔐 安全性

### JWT Token

- 有效期：24 小時
- 算法：HS256
- 包含信息：plan, code, iat, exp

### CORS 保護

只允許配置的來源訪問 API：
- 生產環境：`https://apcs-space.pages.dev`
- 開發環境：`http://localhost:8000`

### SQL 注入防護

使用參數化查詢，防止 SQL 注入：
```javascript
await env.DB.prepare('SELECT * FROM redemption_codes WHERE code = ?')
  .bind(code)
  .first();
```

## 📊 監控

### Cloudflare Dashboard

1. **Workers Metrics**
   - 請求數
   - 錯誤率
   - 響應時間
   - CPU 使用時間

2. **D1 Metrics**
   - 讀取次數
   - 寫入次數
   - 存儲使用量

3. **KV Metrics**
   - 讀取次數
   - 寫入次數
   - 存儲使用量

### 設置告警

```bash
# 在 Cloudflare Dashboard 設置
Workers → apcs-auth-api → Triggers → Alerts

# 建議告警條件：
- 請求數 > 80,000/天（接近免費額度）
- 錯誤率 > 5%
- 響應時間 > 1000ms
```

## 💰 成本估算

### 免費額度

| 服務 | 免費額度 | 超出費用 |
|------|----------|----------|
| Workers | 100,000 請求/天 | $0.50/百萬請求 |
| D1 | 5GB 存儲 + 500 萬讀取/天 | $0.75/GB + $0.001/千次讀取 |
| KV | 100,000 讀取/天 | $0.50/百萬讀取 |

### 預估使用量

**假設 1,000 個活躍用戶：**
- 每人每天訪問 3 次課程
- 每次訪問觸發 1 次 token 驗證
- 總請求：3,000 請求/天
- **成本：$0**（遠低於免費額度）

**假設 10,000 個活躍用戶：**
- 總請求：30,000 請求/天
- **成本：$0**（仍在免費額度內）

**假設 100,000 個活躍用戶：**
- 總請求：300,000 請求/天
- 超出免費額度：200,000 請求/天
- **成本：約 $3/月**

## 🆘 故障排除

### 問題 1：部署失敗

**錯誤：** `Error: Missing required field: database_id`

**解決：**
1. 檢查 `wrangler.toml` 是否存在
2. 確認 `database_id` 已正確填入
3. 重新部署：`wrangler deploy`

### 問題 2：CORS 錯誤

**錯誤：** `Access-Control-Allow-Origin` 錯誤

**解決：**
1. 檢查 `wrangler.toml` 中的 `ALLOWED_ORIGINS`
2. 確認包含你的前端 URL
3. 重新部署 Worker

### 問題 3：Token 無效

**錯誤：** `Invalid token signature`

**解決：**
1. 檢查 `JWT_SECRET` 是否設置：`wrangler secret list`
2. 如果沒有，設置：`wrangler secret put JWT_SECRET`
3. 清除瀏覽器 localStorage，重新獲取 token

### 問題 4：數據庫錯誤

**錯誤：** `D1_ERROR: no such table`

**解決：**
```bash
# 重新執行 schema
wrangler d1 execute apcs-course-db --file=schema.sql

# 驗證
wrangler d1 execute apcs-course-db \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

## 📚 相關文檔

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文檔](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
- [JWT.io](https://jwt.io/) - JWT 調試工具

## 🔄 更新 Worker

### 修改代碼後重新部署

```bash
# 編輯 auth-api.js
vim auth-api.js

# 重新部署
wrangler deploy

# 查看日誌
wrangler tail
```

### 更新環境變數

```bash
# 更新 ALLOWED_ORIGINS
vim wrangler.toml

# 重新部署
wrangler deploy
```

### 更新密鑰

```bash
# 更新 JWT_SECRET
wrangler secret put JWT_SECRET

# 不需要重新部署，立即生效
```

## 🎯 下一步

1. **部署前端**
   - 更新 `web/scripts/api-client.js` 中的 API 端點
   - 推送到 GitHub
   - 在 Cloudflare Pages 部署

2. **測試完整流程**
   - 訪問網站
   - 測試兌換碼
   - 驗證課程訪問控制

3. **生產環境優化**
   - 設置自定義域名
   - 配置 CDN 快取
   - 添加更多兌換碼

4. **監控和分析**
   - 設置告警
   - 定期檢查日誌
   - 分析用戶行為

---

**需要幫助？** 參考 `../方案B部署檢查清單.md` 獲取詳細步驟。
