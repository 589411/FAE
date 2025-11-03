# 🔧 子域名 DNS 設置修正

## 🎯 你的域名結構

- **主域名**: `launchdock.app`
- **子域名**: `apcs.launchdock.app`
- **Email 發送地址**: `noreply@apcs.launchdock.app`

---

## ✅ 正確的 DNS 記錄設置

### 記錄 1：SPF（需要修正）

因為你使用子域名，SPF 記錄應該設置在**子域名**上：

| 欄位 | 值 |
|------|-----|
| 類型 | TXT |
| 名稱 | `apcs` （不是 `@`） |
| 內容 | `v=spf1 include:relay.mailchannels.net ~all` |
| TTL | Auto |

### 記錄 2：Domain Lockdown（新增）

| 欄位 | 值 |
|------|-----|
| 類型 | TXT |
| 名稱 | `_mailchannels.apcs` |
| 內容 | `v=mc1 cfid=apcs-auth-api.589411.workers.dev` |
| TTL | Auto |

---

## 🔍 檢查當前 DNS 設置

### 檢查 SPF 記錄

```bash
dig TXT apcs.launchdock.app
```

**當前結果**（你已經設置了）：
```
apcs.launchdock.app. 300 IN TXT "v=spf1 include:relay.mailchannels.net ~all"
```
✅ 這個是正確的！

### 檢查 Domain Lockdown 記錄

```bash
dig TXT _mailchannels.apcs.launchdock.app
```

**預期結果**（需要添加）：
```
_mailchannels.apcs.launchdock.app. 300 IN TXT "v=mc1 cfid=apcs-auth-api.589411.workers.dev"
```

---

## 📋 在 Cloudflare 中設置

### 步驟 1：確認 SPF 記錄（應該已經有了）

在 Cloudflare DNS 中，應該看到：
- **Type**: TXT
- **Name**: `apcs`
- **Content**: `v=spf1 include:relay.mailchannels.net ~all`

### 步驟 2：添加 Domain Lockdown 記錄

1. 登入 Cloudflare Dashboard
2. 選擇域名 `launchdock.app`
3. 進入 **DNS** 頁面
4. 點擊 **Add record**
5. 填寫：
   - **Type**: TXT
   - **Name**: `_mailchannels.apcs`
   - **Content**: `v=mc1 cfid=apcs-auth-api.589411.workers.dev`
   - **Proxy status**: DNS only（灰色雲朵）
   - **TTL**: Auto
6. 點擊 **Save**

---

## 🎯 完整 DNS 記錄列表

在 Cloudflare 的 `launchdock.app` 域名下，你應該有這兩個 TXT 記錄：

| Name | Type | Content |
|------|------|---------|
| `apcs` | TXT | `v=spf1 include:relay.mailchannels.net ~all` |
| `_mailchannels.apcs` | TXT | `v=mc1 cfid=apcs-auth-api.589411.workers.dev` |

---

## ✅ 驗證步驟

### 1. 檢查 Domain Lockdown 是否生效

```bash
dig TXT _mailchannels.apcs.launchdock.app
```

### 2. 等待 5-10 分鐘讓 DNS 生效

### 3. 測試發送

```bash
curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"test123456","name":"測試"}'
```

應該看到：
```json
{
  "success": true,
  "emailSent": true  ← 這裡應該變成 true
}
```

---

## 🔍 為什麼需要 Domain Lockdown？

MailChannels 從 2024 年開始要求所有域名設置 Domain Lockdown 記錄，這是為了：

1. **防止濫用** - 確保只有你的 Worker 可以使用你的域名發送郵件
2. **安全性** - 防止其他人冒用你的域名
3. **必需** - 沒有這個記錄，MailChannels 會返回 401 錯誤

---

**現在就去添加 `_mailchannels.apcs` 這個 TXT 記錄！** 🚀

這是讓 Email 發送成功的最後一步！
