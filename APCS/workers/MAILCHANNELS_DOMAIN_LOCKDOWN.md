# 🔒 MailChannels Domain Lockdown 設置

## ⚠️ 重要：MailChannels 新政策

從 2024 年開始，MailChannels 要求設置 **Domain Lockdown** TXT 記錄來防止濫用。

---

## 📋 需要添加的 DNS 記錄

### 記錄 1：SPF（已完成 ✅）

| 欄位 | 值 |
|------|-----|
| 類型 | TXT |
| 名稱 | `@` |
| 內容 | `v=spf1 include:relay.mailchannels.net ~all` |

### 記錄 2：Domain Lockdown（必需 ⚠️）

| 欄位 | 值 |
|------|-----|
| 類型 | TXT |
| 名稱 | `_mailchannels.apcs.launchdock.app` |
| 內容 | `v=mc1 cfid=apcs-auth-api.589411.workers.dev` |

**重要**：
- `cfid` 必須是你的 **Worker 域名**
- 格式：`<worker-name>.<account-id>.workers.dev`
- 你的 Worker：`apcs-auth-api.589411.workers.dev`

---

## 🚀 快速設置步驟

### 在 Cloudflare DNS 中添加記錄：

1. 登入 Cloudflare Dashboard
2. 選擇域名 `launchdock.app`
3. 進入 **DNS** 頁面
4. 點擊 **Add record**
5. 填寫：
   - **Type**: TXT
   - **Name**: `_mailchannels.apcs`
   - **Content**: `v=mc1 cfid=apcs-auth-api.589411.workers.dev`
   - **TTL**: Auto
6. 點擊 **Save**

---

## ✅ 驗證設置

### 檢查 Domain Lockdown 記錄

```bash
dig TXT _mailchannels.apcs.launchdock.app
```

**預期結果**：
```
_mailchannels.apcs.launchdock.app. 300 IN TXT "v=mc1 cfid=apcs-auth-api.589411.workers.dev"
```

---

## 🧪 測試

等待 DNS 生效後（5-10 分鐘），再次測試：

```bash
curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"test123456","name":"測試"}'
```

應該看到：
```json
{
  "success": true,
  "message": "註冊成功！請查收驗證 Email",
  "userId": 13,
  "emailSent": true  ← 這裡應該是 true
}
```

---

## 📊 完整 DNS 記錄總結

你需要設置的兩個 TXT 記錄：

| 名稱 | 內容 | 狀態 |
|------|------|------|
| `@` 或 `apcs.launchdock.app` | `v=spf1 include:relay.mailchannels.net ~all` | ✅ 已設置 |
| `_mailchannels.apcs.launchdock.app` | `v=mc1 cfid=apcs-auth-api.589411.workers.dev` | ⚠️ 待設置 |

---

## 🔍 為什麼需要 Domain Lockdown？

**安全性**：防止其他人使用你的域名發送郵件  
**驗證**：確保只有你的 Worker 可以使用 MailChannels  
**必需**：沒有這個記錄，MailChannels 會拒絕發送

---

## 📚 參考

- [MailChannels Domain Lockdown 文檔](https://support.mailchannels.com/hc/en-us/articles/16918954360845-Secure-your-domain-name-against-spoofing-with-Domain-Lockdown)

---

**現在就去添加 Domain Lockdown 記錄！** 🔒
