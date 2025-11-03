# 📧 Email 發送設置指南

## 🎯 問題說明

MailChannels 需要域名驗證（SPF/DKIM 記錄），對於 `workers.dev` 子域名有限制。

## ✅ 推薦方案：使用 Resend

### 為什麼選擇 Resend？

- ✅ **免費額度**: 3,000 封/月，100 封/天
- ✅ **無需域名**: 可以使用 `onboarding@resend.dev`
- ✅ **5 分鐘設置**: 非常簡單
- ✅ **優秀的 API**: 文檔清晰，易於整合
- ✅ **可靠性高**: 專業的 Email 服務提供商

### 設置步驟

#### 1. 註冊 Resend 帳號

1. 訪問 https://resend.com
2. 使用 GitHub 或 Email 註冊
3. 驗證 Email

#### 2. 獲取 API Key

1. 登入 Resend Dashboard
2. 進入 **API Keys** 頁面
3. 點擊 **Create API Key**
4. 名稱：`APCS Course`
5. 權限：**Sending access**
6. 複製 API Key（只會顯示一次！）

#### 3. 設置 Cloudflare Worker Secret

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler secret put RESEND_API_KEY
# 貼上你的 Resend API Key
```

#### 4. 更新代碼

已經準備好使用 Resend 的代碼版本，只需要：

```bash
# 複製 Resend 版本的代碼
cp auth-handlers-resend.js auth-handlers.js

# 部署
wrangler deploy
```

#### 5. 測試

```bash
curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@gmail.com","password":"test123456","name":"測試用戶"}'
```

檢查你的 Email 收件箱！

---

## 🔄 方案 B：MailChannels（需要自訂域名）

如果你有自訂域名（如 `fae.academy`），可以使用 MailChannels：

### 前置需求

1. 擁有域名
2. 域名 DNS 託管在 Cloudflare
3. 設置 SPF 記錄

### SPF 記錄設置

在 Cloudflare DNS 中添加 TXT 記錄：

```
Name: @
Type: TXT
Content: v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net ~all
```

### 更新代碼

將 `from.email` 改為你的域名：

```javascript
from: {
  email: 'noreply@your-domain.com',
  name: 'APCS 太空探險課程',
}
```

---

## 📊 方案比較

| 特性 | Resend | MailChannels |
|------|--------|--------------|
| 免費額度 | 3,000/月 | 無限制 |
| 設置難度 | ⭐ 簡單 | ⭐⭐⭐ 複雜 |
| 需要域名 | ❌ 否 | ✅ 是 |
| 可靠性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| API 品質 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**推薦**: 使用 Resend 🎯

---

## 🎯 下一步

1. 註冊 Resend 帳號
2. 獲取 API Key
3. 設置 Worker Secret
4. 部署並測試

預計時間：**10 分鐘** ⏱️
