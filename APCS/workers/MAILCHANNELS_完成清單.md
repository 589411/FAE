# ✅ MailChannels Email 設置完成清單

## 📋 已完成

- ✅ 更新代碼使用 MailChannels API
- ✅ 設置發送域名為 `apcs.launchdock.app`
- ✅ 移除 DKIM 要求（簡化設置）
- ✅ 部署 Worker 到生產環境
- ✅ 創建詳細的 DNS 設置文檔

---

## 🎯 你需要完成的步驟

### 步驟 1：設置 SPF DNS 記錄（必需）⚠️

**在你的 DNS 管理面板添加以下記錄**：

| 欄位 | 值 |
|------|-----|
| 類型 | TXT |
| 名稱 | `@` 或 `apcs.launchdock.app` |
| 內容 | `v=spf1 include:relay.mailchannels.net ~all` |
| TTL | 自動 或 3600 |

**如果你的域名在 Cloudflare**：
1. 登入 Cloudflare Dashboard
2. 選擇域名 `launchdock.app`
3. 進入 **DNS** 頁面
4. 點擊 **Add record**
5. 填寫上述資訊
6. 點擊 **Save**

**如果你的域名在其他服務商**：
- 查看 `QUICK_DNS_SETUP.md` 獲取詳細指南

---

### 步驟 2：等待 DNS 生效（5-10 分鐘）

DNS 記錄需要時間傳播，通常 5-10 分鐘，最長可能需要 24 小時。

**驗證 DNS 是否生效**：
```bash
dig TXT apcs.launchdock.app
```

預期看到：
```
apcs.launchdock.app. 3600 IN TXT "v=spf1 include:relay.mailchannels.net ~all"
```

---

### 步驟 3：測試 Email 發送

**使用你的真實 Email 測試**（替換下面的 Email）：

```bash
curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"test123456","name":"測試用戶"}'
```

**預期響應**：
```json
{
  "success": true,
  "message": "註冊成功！請查收驗證 Email",
  "userId": 11,
  "emailSent": true
}
```

**檢查你的 Email 收件箱**：
- 發件人：`APCS 太空探險課程 <noreply@apcs.launchdock.app>`
- 主旨：`🚀 驗證您的 APCS 帳號`
- 內容：精美的 HTML 驗證碼

---

### 步驟 4：查看日誌（可選）

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler tail --format pretty
```

然後在另一個終端測試註冊，你應該看到：
```
✅ 驗證 Email 已發送至: your-email@gmail.com
```

---

## 📊 當前配置

### Email 設置
- **服務**: MailChannels（免費無限制）
- **發送域名**: `apcs.launchdock.app`
- **發送地址**: `noreply@apcs.launchdock.app`
- **發送名稱**: `APCS 太空探險課程`

### DNS 記錄（需要設置）
- **SPF**: ⚠️ 待設置
- **DKIM**: ❌ 未使用（簡化版本）
- **DMARC**: ❌ 可選

### Worker 狀態
- **部署狀態**: ✅ 已部署
- **版本**: `9fdc8cd6-0f13-4bb7-9c75-dd5d899155`
- **URL**: `https://apcs-auth-api.589411.workers.dev`

---

## 🔍 故障排除

### 問題 1：Email 沒收到

**可能原因**：
1. DNS 記錄未設置或未生效
2. Email 進入垃圾郵件資料夾
3. MailChannels API 錯誤

**解決方法**：
1. 驗證 DNS 記錄：`dig TXT apcs.launchdock.app`
2. 檢查垃圾郵件資料夾
3. 查看 Worker 日誌：`wrangler tail`

### 問題 2：MailChannels 返回 401 錯誤

**原因**: SPF 記錄未設置或未生效

**解決方法**：
1. 確認 SPF 記錄已添加
2. 等待 DNS 生效（5-30 分鐘）
3. 使用 `dig` 命令驗證

### 問題 3：Email 進入垃圾郵件

**改善方法**：
1. 添加 DKIM 記錄（參考 `MAILCHANNELS_DNS_SETUP.md`）
2. 添加 DMARC 記錄
3. 讓用戶將 `noreply@apcs.launchdock.app` 加入白名單

---

## 📚 相關文檔

- `QUICK_DNS_SETUP.md` - 快速 DNS 設置指南（5 分鐘）
- `MAILCHANNELS_DNS_SETUP.md` - 完整 DNS 設置指南（包含 DKIM）
- `EMAIL_SETUP_GUIDE.md` - Email 方案比較
- `RESEND_SETUP.md` - Resend 替代方案

---

## 🎯 下一步

完成 SPF 記錄設置後：

1. ✅ Email 發送功能完全可用
2. 🔄 可以開始整合 Google OAuth
3. 🔗 可以綁定兌換碼與會員系統
4. 📱 可以開發設備管理功能

---

## ⏱️ 預計時間

- **DNS 設置**: 2 分鐘
- **DNS 生效**: 5-10 分鐘
- **測試驗證**: 2 分鐘

**總計**: 10-15 分鐘 🎯

---

**現在就去設置 SPF 記錄吧！** 🚀

只需要一個 TXT 記錄，Email 功能就能正常運作了！
