# 🔄 更新 Domain Lockdown 記錄

## ⚠️ 問題

當前的 Domain Lockdown 記錄使用的是：
```
v=mc1 cfid=apcs-auth-api.589411.workers.dev
```

但現在 Worker 通過自訂域名訪問，需要更新為：
```
v=mc1 cfid=api.apcs.launchdock.app
```

---

## 📋 更新步驟

### 1. 登入 Cloudflare Dashboard

訪問：https://dash.cloudflare.com

### 2. 進入 DNS 管理

1. 選擇域名 `launchdock.app`
2. 點擊 **DNS** 標籤

### 3. 找到並編輯 Domain Lockdown 記錄

找到這個記錄：
- **Name**: `_mailchannels.apcs`
- **Type**: TXT
- **Content**: `v=mc1 cfid=apcs-auth-api.589411.workers.dev`

### 4. 更新內容

點擊 **Edit**，將 Content 改為：
```
v=mc1 cfid=api.apcs.launchdock.app
```

### 5. 保存

點擊 **Save**

---

## ✅ 驗證

等待 1-2 分鐘後，檢查 DNS 記錄：

```bash
dig TXT _mailchannels.apcs.launchdock.app
```

應該看到：
```
_mailchannels.apcs.launchdock.app. 300 IN TXT "v=mc1 cfid=api.apcs.launchdock.app"
```

---

## 🧪 測試

DNS 更新後，測試 Email 發送：

```bash
curl -k -X POST https://api.apcs.launchdock.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"test123456","name":"測試"}'
```

應該看到：
```json
{
  "success": true,
  "emailSent": true  ← 這裡應該是 true！
}
```

---

**現在就去更新 Domain Lockdown 記錄吧！** 🚀

將 `cfid` 從 `apcs-auth-api.589411.workers.dev` 改為 `api.apcs.launchdock.app`
