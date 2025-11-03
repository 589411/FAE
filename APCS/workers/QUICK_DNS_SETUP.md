# ⚡ 快速 DNS 設置指南（5 分鐘）

## 🎯 目標
設置 SPF 記錄，讓 MailChannels 可以代表 `apcs.launchdock.app` 發送郵件

---

## 📋 只需一個 DNS 記錄！

### SPF 記錄設置

1. **登入你的 DNS 管理面板**
   - 如果域名在 Cloudflare：登入 Cloudflare Dashboard
   - 如果在其他服務商：登入對應的管理面板

2. **添加 TXT 記錄**
   
   | 欄位 | 值 |
   |------|-----|
   | **類型** | TXT |
   | **名稱** | `@` 或 `apcs.launchdock.app` |
   | **內容** | `v=spf1 include:relay.mailchannels.net ~all` |
   | **TTL** | 自動 或 3600 |

3. **保存記錄**

4. **等待 DNS 生效**（5-10 分鐘）

---

## ✅ 驗證 DNS 設置

### 方法 1：使用命令行

```bash
dig TXT apcs.launchdock.app
```

**預期看到**:
```
apcs.launchdock.app. 3600 IN TXT "v=spf1 include:relay.mailchannels.net ~all"
```

### 方法 2：使用線上工具

訪問: https://mxtoolbox.com/spf.aspx  
輸入: `apcs.launchdock.app`  
點擊 **SPF Record Lookup**

**預期結果**: ✅ SPF record found

---

## 🚀 部署並測試

### 1. 部署 Worker

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler deploy
```

### 2. 測試發送（使用你的真實 Email）

```bash
curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"test123456","name":"測試用戶"}'
```

### 3. 檢查收件箱

- 查看收件箱
- 如果沒有，檢查垃圾郵件資料夾
- Email 來自: `noreply@apcs.launchdock.app`

---

## 📊 Cloudflare DNS 設置截圖參考

如果你使用 Cloudflare：

1. 進入 **DNS** 頁面
2. 點擊 **Add record**
3. 選擇 **TXT**
4. 填寫：
   - Name: `@`
   - Content: `v=spf1 include:relay.mailchannels.net ~all`
   - Proxy status: DNS only（灰色雲朵）
5. 點擊 **Save**

---

## ⏱️ 時間線

- **DNS 設置**: 2 分鐘
- **DNS 生效**: 5-10 分鐘
- **部署測試**: 2 分鐘

**總計**: 約 10-15 分鐘 🎯

---

## 🔍 故障排除

### Email 沒收到？

1. **檢查 DNS 是否生效**
   ```bash
   dig TXT apcs.launchdock.app
   ```

2. **查看 Worker 日誌**
   ```bash
   wrangler tail --format pretty
   ```

3. **檢查垃圾郵件資料夾**

4. **確認 Email 地址正確**

### DNS 記錄不生效？

- 等待更長時間（最多 24 小時）
- 清除 DNS 快取
- 確認記錄格式正確（沒有多餘空格）

---

## 🎉 完成後

Email 發送功能就可以正常運作了！

**發送地址**: `noreply@apcs.launchdock.app`  
**域名**: `apcs.launchdock.app`  
**服務**: MailChannels（免費無限制）

---

**準備好了嗎？開始設置吧！** 🚀

只需要添加一個 TXT 記錄，就這麼簡單！
