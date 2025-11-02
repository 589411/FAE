# 🔗 如何填入 Worker URL

## 📋 完整流程

### 步驟 1：部署 Worker 並獲取 URL

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
./deploy.sh
```

**部署成功後，你會看到：**
```
✅ Successfully uploaded apcs-auth-api
Published apcs-auth-api (2.34 sec)
  https://apcs-auth-api.your-account.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**重要：** 複製這個 URL：`https://apcs-auth-api.your-account.workers.dev`

---

### 步驟 2：更新前端 API 端點

#### 方法 1：手動編輯（推薦）

打開文件：
```
/Users/yen-tangchang/Documents/github/FAE/APCS/web/scripts/api-client.js
```

找到第 7 行：
```javascript
const API_BASE_URL = 'https://apcs-auth.your-worker.workers.dev';
```

**替換為你的 Worker URL：**
```javascript
const API_BASE_URL = 'https://apcs-auth-api.your-account.workers.dev';
```

#### 方法 2：使用命令行

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS

# 替換 URL（記得改成你的實際 URL）
sed -i '' "s|https://apcs-auth.your-worker.workers.dev|https://apcs-auth-api.your-account.workers.dev|g" web/scripts/api-client.js
```

---

### 步驟 3：更新 CORS 設置

編輯 `workers/wrangler.toml`，確保包含你的 Pages URL：

```toml
[vars]
ALLOWED_ORIGINS = "https://your-site.pages.dev,http://localhost:8000"
```

**替換為你的實際 Pages URL。**

---

### 步驟 4：重新部署

```bash
# 重新部署 Worker（如果修改了 CORS）
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler deploy

# 提交前端更新
cd /Users/yen-tangchang/Documents/github/FAE
git add APCS/web/scripts/api-client.js
git commit -m "更新 Worker API 端點"
git push
```

---

## 🧪 測試連接

### 測試 1：直接測試 Worker

```bash
# 替換為你的 Worker URL
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

### 測試 2：測試兌換碼驗證

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

### 測試 3：在瀏覽器測試

1. 打開 `http://localhost:8000/unlock.html`（本地測試）
2. 或打開 `https://your-site.pages.dev/unlock.html`（線上測試）
3. 輸入兌換碼：`APCS2024-DEMO02`
4. 點擊「驗證兌換碼」

**預期結果：**
- 顯示「驗證中...」
- 顯示「解鎖成功！」
- 自動跳轉到首頁

---

## 🔍 如何找到你的 Worker URL

### 方法 1：從部署輸出中查找

部署時會顯示 URL，向上滾動終端查看。

### 方法 2：使用 Wrangler 命令

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler deployments list
```

### 方法 3：從 Cloudflare Dashboard 查看

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇 **Workers & Pages**
3. 找到 `apcs-auth-api`
4. 查看 **Preview** 或 **Production** URL

---

## 📝 完整範例

### 假設你的 Worker URL 是：
```
https://apcs-auth-api.abc123.workers.dev
```

### 1. 更新 api-client.js

```javascript
// 修改前
const API_BASE_URL = 'https://apcs-auth.your-worker.workers.dev';

// 修改後
const API_BASE_URL = 'https://apcs-auth-api.abc123.workers.dev';
```

### 2. 更新 wrangler.toml

```toml
[vars]
ALLOWED_ORIGINS = "https://apcs-space.pages.dev,http://localhost:8000"
```

### 3. 測試

```bash
# 測試健康檢查
curl https://apcs-auth-api.abc123.workers.dev/api/health

# 測試兌換碼
curl -X POST https://apcs-auth-api.abc123.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO01"}'
```

---

## ⚠️ 常見錯誤

### 錯誤 1：CORS 錯誤

**錯誤訊息：**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**解決方法：**
1. 檢查 `wrangler.toml` 中的 `ALLOWED_ORIGINS`
2. 確認包含你的前端 URL
3. 重新部署 Worker：`wrangler deploy`

### 錯誤 2：404 Not Found

**錯誤訊息：**
```
404 Not Found
```

**解決方法：**
1. 確認 Worker URL 正確
2. 確認 Worker 已部署：`wrangler deployments list`
3. 確認 API 路徑正確（`/api/validate-code`）

### 錯誤 3：URL 格式錯誤

**錯誤格式：**
```javascript
const API_BASE_URL = 'apcs-auth-api.workers.dev';  // ❌ 缺少 https://
const API_BASE_URL = 'https://apcs-auth-api.workers.dev/';  // ❌ 結尾不要加 /
```

**正確格式：**
```javascript
const API_BASE_URL = 'https://apcs-auth-api.abc123.workers.dev';  // ✅
```

---

## 🎯 檢查清單

完成以下步驟確保 Worker URL 正確設置：

- [ ] Worker 已成功部署
- [ ] 已複製 Worker URL
- [ ] 已更新 `api-client.js` 中的 `API_BASE_URL`
- [ ] URL 格式正確（有 `https://`，結尾無 `/`）
- [ ] 已更新 `wrangler.toml` 中的 `ALLOWED_ORIGINS`
- [ ] 已重新部署 Worker（如果修改了 CORS）
- [ ] 已測試健康檢查端點
- [ ] 已測試兌換碼驗證
- [ ] 已在瀏覽器測試完整流程

---

## 🚀 快速命令參考

```bash
# 部署 Worker
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
./deploy.sh

# 查看部署列表
wrangler deployments list

# 測試 API
./test-api.sh https://your-worker-url.workers.dev

# 查看日誌
wrangler tail

# 重新部署
wrangler deploy
```

---

## ✅ 完成！

當你看到測試成功的響應，就表示 Worker URL 已正確設置！

**下一步：** 部署前端到 Cloudflare Pages，然後進行端到端測試。
