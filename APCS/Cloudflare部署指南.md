# Cloudflare Pages + Workers 完整部署指南

## 🎯 架構說明

```
用戶瀏覽器
    ↓
Cloudflare Pages (靜態網站)
    ↓ API 調用
Cloudflare Workers (認證 API)
    ↓ 數據查詢
Cloudflare D1 (SQLite 數據庫)
Cloudflare KV (快取存儲)
```

**優點：**
- ✅ 完全無服務器
- ✅ 全球 CDN 加速
- ✅ 安全可靠
- ✅ 成本極低（免費額度足夠）
- ✅ 自動擴展

---

## 📋 部署步驟

### 步驟 1：部署 Cloudflare Pages（靜態網站）

#### 1.1 推送代碼到 GitHub

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/web
git add -A
git commit -m "準備部署到 Cloudflare Pages"
git push origin main
```

#### 1.2 連接 Cloudflare Pages

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
   ```
6. 點擊 **Save and Deploy**

#### 1.3 獲取網站 URL

部署完成後，你會得到一個 URL：
```
https://apcs-space.pages.dev
```

---

### 步驟 2：創建 Cloudflare D1 數據庫

#### 2.1 使用 Wrangler CLI

```bash
# 安裝 Wrangler
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 創建 D1 數據庫
wrangler d1 create apcs-course-db
```

#### 2.2 記錄數據庫 ID

命令會返回：
```
✅ Successfully created DB 'apcs-course-db'
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**保存這個 ID！**

#### 2.3 初始化數據庫

```bash
# 執行 schema
wrangler d1 execute apcs-course-db --file=../workers/schema.sql
```

#### 2.4 驗證數據庫

```bash
# 查詢測試數據
wrangler d1 execute apcs-course-db --command="SELECT * FROM redemption_codes"
```

應該看到 5 個測試兌換碼。

---

### 步驟 3：創建 Cloudflare KV 命名空間

```bash
# 創建 KV 命名空間
wrangler kv:namespace create "COURSE_ACCESS"
```

記錄返回的 ID：
```
✅ Success!
Add the following to your wrangler.toml:
{ binding = "COURSE_ACCESS", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

---

### 步驟 4：部署 Cloudflare Workers

#### 4.1 創建 wrangler.toml

在 `workers/` 目錄創建 `wrangler.toml`：

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
ALLOWED_ORIGINS = "https://apcs-space.pages.dev"

# 密鑰（使用 wrangler secret）
# JWT_SECRET = "將通過命令行設置"
```

#### 4.2 設置密鑰

```bash
cd workers
wrangler secret put JWT_SECRET
# 輸入一個強密碼，例如：apcs-2024-super-secret-key-change-me
```

#### 4.3 部署 Worker

```bash
wrangler deploy
```

#### 4.4 獲取 Worker URL

部署成功後會顯示：
```
✅ Published apcs-auth-api
  https://apcs-auth-api.your-account.workers.dev
```

**保存這個 URL！**

---

### 步驟 5：連接 Pages 和 Workers

#### 5.1 更新前端 API 端點

編輯 `web/scripts/api-client.js`：

```javascript
// 替換為你的 Worker URL
const API_BASE_URL = 'https://apcs-auth-api.your-account.workers.dev';
```

#### 5.2 重新部署 Pages

```bash
git add -A
git commit -m "更新 API 端點"
git push
```

Cloudflare Pages 會自動重新部署。

---

### 步驟 6：配置自定義域名（可選）

#### 6.1 在 Cloudflare Pages 設置

1. Pages → 你的項目 → **Custom domains**
2. 添加域名：`apcs-space.com`
3. 按照指示更新 DNS 記錄

#### 6.2 在 Worker 設置

1. Workers → 你的 Worker → **Triggers**
2. 添加自定義域名：`api.apcs-space.com`

#### 6.3 更新 CORS 設置

在 `workers/auth-api.js` 中更新：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://apcs-space.com',
  // ...
};
```

---

## 🔧 配置說明

### 環境變數

| 變數名 | 說明 | 設置方式 |
|--------|------|----------|
| `JWT_SECRET` | JWT 簽名密鑰 | `wrangler secret put` |
| `ALLOWED_ORIGINS` | 允許的來源 | `wrangler.toml` |

### 綁定資源

| 綁定名 | 類型 | 用途 |
|--------|------|------|
| `DB` | D1 Database | 儲存兌換碼和記錄 |
| `COURSE_ACCESS` | KV Namespace | 快取訪問 token |

---

## 🧪 測試部署

### 測試 1：訪問網站

```
https://apcs-space.pages.dev
```

應該看到課程列表，B1-E1 被鎖定。

### 測試 2：測試兌換碼

1. 訪問：`https://apcs-space.pages.dev/unlock.html`
2. 輸入：`APCS2024-DEMO01`
3. 應該成功解鎖

### 測試 3：驗證 API

```bash
# 測試驗證兌換碼 API
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO02"}'
```

應該返回：
```json
{
  "valid": true,
  "token": "eyJ...",
  "message": "解鎖成功！"
}
```

### 測試 4：檢查數據庫

```bash
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM redemption_codes WHERE used = 1"
```

應該看到已使用的兌換碼。

---

## 📊 監控與分析

### Cloudflare Analytics

1. Pages → 你的項目 → **Analytics**
   - 查看訪問量
   - 地理分布
   - 流量趨勢

2. Workers → 你的 Worker → **Metrics**
   - API 調用次數
   - 錯誤率
   - 響應時間

### 設置告警

1. Workers → 你的 Worker → **Triggers** → **Alerts**
2. 設置條件：
   - 錯誤率 > 5%
   - 請求數 > 10,000/天

---

## 💰 成本估算

### 免費額度（足夠小型商業使用）

| 服務 | 免費額度 | 超出費用 |
|------|----------|----------|
| Pages | 無限請求 | $0 |
| Workers | 100,000 請求/天 | $0.50/百萬請求 |
| D1 | 5GB 存儲 | $0.75/GB |
| KV | 100,000 讀取/天 | $0.50/百萬讀取 |

**預估成本：**
- 月訪問 10,000 用戶：**$0**
- 月訪問 100,000 用戶：**~$5-10**
- 月訪問 1,000,000 用戶：**~$50-100**

---

## 🔐 安全最佳實踐

### 1. 定期更換 JWT_SECRET

```bash
wrangler secret put JWT_SECRET
# 輸入新密碼
```

### 2. 限制 CORS

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://apcs-space.com', // 只允許你的域名
};
```

### 3. 添加速率限制

在 Worker 中添加：

```javascript
// 使用 KV 記錄請求次數
const key = `rate:${request.headers.get('CF-Connecting-IP')}`;
const count = await env.COURSE_ACCESS.get(key) || 0;

if (count > 100) { // 每小時最多 100 次
  return new Response('Too Many Requests', { status: 429 });
}

await env.COURSE_ACCESS.put(key, count + 1, { expirationTtl: 3600 });
```

### 4. 記錄可疑活動

```javascript
if (suspiciousActivity) {
  await env.DB.prepare(
    'INSERT INTO security_logs (ip, action, timestamp) VALUES (?, ?, ?)'
  ).bind(ip, action, new Date().toISOString()).run();
}
```

---

## 🚀 進階功能

### 1. 自動生成兌換碼

創建一個 Worker Cron Job：

```javascript
export default {
  async scheduled(event, env, ctx) {
    // 每天生成 10 個新兌換碼
    for (let i = 0; i < 10; i++) {
      const code = generateCode();
      await env.DB.prepare(
        'INSERT INTO redemption_codes (code, plan) VALUES (?, ?)'
      ).bind(code, 'full').run();
    }
  }
}
```

### 2. 郵件通知

整合 Resend API：

```javascript
async function sendUnlockEmail(email, code) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'APCS 課程 <noreply@apcs-space.com>',
      to: email,
      subject: '您的課程兌換碼',
      html: `<h1>您的兌換碼：${code}</h1>`
    })
  });
}
```

### 3. 分析儀表板

創建一個管理頁面：

```html
<!-- admin.html -->
<script>
async function getStats() {
  const response = await fetch('/api/admin/stats', {
    headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
  });
  const stats = await response.json();
  
  console.log('總兌換碼:', stats.totalCodes);
  console.log('已使用:', stats.usedCodes);
  console.log('轉換率:', stats.conversionRate);
}
</script>
```

---

## 🐛 常見問題

### Q: Worker 部署失敗？
**A:** 檢查 `wrangler.toml` 中的 database_id 和 KV id 是否正確

### Q: CORS 錯誤？
**A:** 確認 Worker 中的 `Access-Control-Allow-Origin` 設置正確

### Q: 兌換碼驗證失敗？
**A:** 
1. 檢查數據庫是否正確初始化
2. 使用 `wrangler d1 execute` 查詢數據
3. 檢查 Worker 日誌：`wrangler tail`

### Q: Token 無效？
**A:** 
1. 檢查 JWT_SECRET 是否設置
2. 清除瀏覽器 localStorage
3. 重新獲取 token

---

## 📚 相關資源

- [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文檔](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)

---

## ✅ 部署檢查清單

- [ ] GitHub 代碼已推送
- [ ] Cloudflare Pages 已部署
- [ ] D1 數據庫已創建並初始化
- [ ] KV 命名空間已創建
- [ ] Worker 已部署
- [ ] JWT_SECRET 已設置
- [ ] API 端點已更新
- [ ] 測試兌換碼功能
- [ ] 測試課程訪問控制
- [ ] 設置自定義域名（可選）
- [ ] 配置 Analytics

---

**部署完成後，你將擁有一個完全自動化、安全可靠的會員系統！** 🎉
