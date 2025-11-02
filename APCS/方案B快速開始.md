# 🚀 方案 B 快速開始指南

## 📋 方案 B 概述

**Cloudflare Workers + D1 數據庫**
- ✅ 服務器端驗證兌換碼
- ✅ JWT token 管理
- ✅ 完整的使用追蹤
- ✅ 高度安全
- ✅ 月成本 $0-5（免費額度足夠 10,000 用戶）
- ✅ 全球 CDN 加速

---

## ⚡ 5 分鐘快速部署

### 方法 1：使用自動部署腳本（最簡單）

```bash
# 1. 進入 workers 目錄
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 2. 執行自動部署腳本
./deploy.sh

# 3. 按照提示完成部署
# - 登入 Cloudflare
# - 創建 D1 數據庫
# - 創建 KV 命名空間
# - 設置 JWT 密鑰
# - 部署 Worker

# 4. 測試 API
./test-api.sh
```

**就這麼簡單！** 🎉

---

## 📝 詳細步驟（如果需要手動控制）

### 步驟 1：安裝 Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 步驟 2：創建資源

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 創建 D1 數據庫
wrangler d1 create apcs-course-db

# 創建 KV 命名空間
wrangler kv:namespace create "COURSE_ACCESS"
```

**重要：複製並保存返回的 ID！**

### 步驟 3：配置 wrangler.toml

創建 `wrangler.toml` 文件：

```toml
name = "apcs-auth-api"
main = "auth-api.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "apcs-course-db"
database_id = "填入你的 database_id"

[[kv_namespaces]]
binding = "COURSE_ACCESS"
id = "填入你的 KV namespace id"

[vars]
ALLOWED_ORIGINS = "http://localhost:8000,https://apcs-space.pages.dev"
```

### 步驟 4：初始化數據庫

```bash
wrangler d1 execute apcs-course-db --file=schema.sql
```

### 步驟 5：設置密鑰

```bash
wrangler secret put JWT_SECRET
# 輸入一個強密碼
```

### 步驟 6：部署

```bash
wrangler deploy
```

### 步驟 7：測試

```bash
./test-api.sh https://apcs-auth-api.your-account.workers.dev
```

---

## ✅ 驗證部署成功

### 檢查清單

- [ ] Worker 已部署並獲得 URL
- [ ] D1 數據庫已創建並初始化
- [ ] KV 命名空間已創建
- [ ] JWT_SECRET 已設置
- [ ] API 健康檢查通過
- [ ] 兌換碼驗證正常
- [ ] Token 生成和驗證正常

### 快速測試

```bash
# 測試健康檢查
curl https://apcs-auth-api.your-account.workers.dev/api/health

# 測試兌換碼
curl -X POST https://apcs-auth-api.your-account.workers.dev/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-DEMO01"}'
```

如果看到成功響應，恭喜！部署完成！ 🎉

---

## 🌐 連接前端

### 更新 API 端點

編輯 `web/scripts/api-client.js`：

```javascript
const API_BASE_URL = 'https://apcs-auth-api.your-account.workers.dev';
```

### 部署到 Cloudflare Pages

```bash
cd /Users/yen-tangchang/Documents/github/FAE
git add -A
git commit -m "更新 API 端點"
git push origin feature/apcs-space-exploration
```

然後在 Cloudflare Dashboard：
1. Pages → Create a project
2. 連接 GitHub
3. 選擇 repository 和分支
4. Root directory: `APCS/web`
5. Deploy

---

## 🧪 完整測試流程

### 1. 訪問網站

```
https://apcs-space.pages.dev
```

**檢查：**
- A1, A2, A3 可以訪問（免費課程）
- B1-E1 顯示鎖定（付費課程）

### 2. 測試兌換碼

訪問：`https://apcs-space.pages.dev/unlock.html`

輸入：`APCS2024-DEMO02`

**預期結果：**
- 顯示「解鎖成功！」
- 自動跳轉到首頁
- B1-E1 課程已解鎖

### 3. 驗證課程訪問

訪問：`https://apcs-space.pages.dev/lessons/L2/B1.html`

**預期結果：**
- 可以正常訪問
- 內容完整顯示

### 4. 測試持久性

1. 關閉瀏覽器
2. 重新打開網站
3. 檢查課程是否仍然解鎖

**預期結果：**
- 課程仍然解鎖（token 保存在 localStorage）

---

## 📊 監控和管理

### 查看使用情況

```bash
# 查看兌換碼狀態
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM redemption_codes"

# 查看使用記錄
wrangler d1 execute apcs-course-db \
  --command="SELECT * FROM usage_logs ORDER BY used_at DESC LIMIT 10"
```

### 查看 Worker 日誌

```bash
wrangler tail
```

### Cloudflare Dashboard

1. **Workers Metrics**
   - 請求數
   - 錯誤率
   - 響應時間

2. **D1 Metrics**
   - 讀寫次數
   - 存儲使用量

---

## 💰 成本預估

### 免費額度

| 服務 | 免費額度 | 足夠支持 |
|------|----------|----------|
| Workers | 100,000 請求/天 | ~30,000 用戶/天 |
| D1 | 5GB 存儲 | ~100 萬兌換碼 |
| KV | 100,000 讀取/天 | ~30,000 用戶/天 |

### 實際成本

**1,000 個活躍用戶：** $0/月
**10,000 個活躍用戶：** $0/月
**100,000 個活躍用戶：** ~$3-5/月

---

## 🔧 常見問題

### Q: 部署腳本卡住了怎麼辦？

**A:** 按 Ctrl+C 退出，然後：
```bash
# 檢查登入狀態
wrangler whoami

# 如果未登入，重新登入
wrangler login
```

### Q: 找不到 database_id 怎麼辦？

**A:** 列出所有數據庫：
```bash
wrangler d1 list
```

### Q: API 測試失敗怎麼辦？

**A:** 檢查：
1. Worker URL 是否正確
2. CORS 設置是否包含測試來源
3. 查看 Worker 日誌：`wrangler tail`

### Q: 如何重置測試兌換碼？

**A:**
```bash
wrangler d1 execute apcs-course-db \
  --command="UPDATE redemption_codes SET used = 0, used_at = NULL WHERE code LIKE 'APCS2024-DEMO%'"
```

---

## 📚 相關文檔

- **詳細部署步驟：** `方案B部署檢查清單.md`
- **API 文檔：** `workers/README.md`
- **商業模式說明：** `商業模式建議.md`
- **實施指南：** `商業模式實施指南.md`
- **會員系統總結：** `會員系統實施總結.md`

---

## 🎯 下一步

### 立即行動（今天）

1. ✅ 執行 `./deploy.sh` 部署 Worker
2. ✅ 執行 `./test-api.sh` 測試 API
3. ✅ 更新前端 API 端點
4. ✅ 部署到 Cloudflare Pages

### 本週完成

1. 📝 設置 Google Form 收集訂單
2. 🎨 準備行銷素材
3. 📊 設置 Analytics 追蹤
4. 🚀 開始推廣

### 持續優化

1. 💳 整合自動支付（當訂單 >50/月）
2. 📧 自動郵件通知
3. 📈 管理儀表板
4. 🎓 添加更多課程

---

## ✨ 總結

方案 B 提供：
- ✅ **高度安全**：服務器端驗證，防止兌換碼分享
- ✅ **完整追蹤**：所有使用記錄都保存在數據庫
- ✅ **極低成本**：月成本 $0-5，支持 10,000+ 用戶
- ✅ **全球加速**：Cloudflare CDN，毫秒級響應
- ✅ **易於擴展**：可輕鬆添加新功能

**現在就開始部署吧！** 🚀

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
./deploy.sh
```
