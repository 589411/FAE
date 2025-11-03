# 📧 MailChannels DNS 設置指南

## 🎯 域名資訊
- **域名**: `apcs.launchdock.app`
- **Email 地址**: `noreply@apcs.launchdock.app`

---

## 📋 需要設置的 DNS 記錄

### 1. SPF 記錄（必需）

**作用**: 授權 MailChannels 代表你的域名發送郵件

**記錄類型**: TXT  
**名稱**: `@` 或 `apcs.launchdock.app`  
**內容**: 
```
v=spf1 include:relay.mailchannels.net ~all
```

**TTL**: 3600（或自動）

---

### 2. DKIM 記錄（推薦，提高送達率）

**作用**: 郵件簽名驗證，防止被標記為垃圾郵件

#### 步驟 1：生成 DKIM 密鑰對

```bash
# 生成私鑰
openssl genrsa -out dkim_private.pem 1024

# 生成公鑰
openssl rsa -in dkim_private.pem -pubout -outform der 2>/dev/null | openssl base64 -A
```

#### 步驟 2：添加 DNS TXT 記錄

**記錄類型**: TXT  
**名稱**: `mailchannels._domainkey.apcs.launchdock.app`  
**內容**: 
```
v=DKIM1; k=rsa; p=<你的公鑰>
```

**範例**:
```
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

#### 步驟 3：設置 Worker Secret（私鑰）

```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers

# 將私鑰內容設置為 Secret
wrangler secret put DKIM_PRIVATE_KEY
# 貼上 dkim_private.pem 的完整內容（包括 BEGIN 和 END 行）
```

---

### 3. DMARC 記錄（可選，但推薦）

**作用**: 定義郵件驗證失敗時的處理策略

**記錄類型**: TXT  
**名稱**: `_dmarc.apcs.launchdock.app`  
**內容**: 
```
v=DMARC1; p=none; rua=mailto:dmarc@apcs.launchdock.app
```

**說明**:
- `p=none`: 不採取行動（監控模式）
- `p=quarantine`: 隔離可疑郵件
- `p=reject`: 拒絕可疑郵件
- `rua`: 接收 DMARC 報告的郵箱

---

## 🚀 快速設置（簡化版）

如果你不想設置 DKIM，可以只設置 SPF：

### 最小配置（只需 SPF）

1. 登入你的 DNS 管理面板（Cloudflare/其他）
2. 添加 TXT 記錄：
   - **名稱**: `@`
   - **內容**: `v=spf1 include:relay.mailchannels.net ~all`
3. 保存並等待 DNS 生效（通常 5-10 分鐘）

### 更新代碼（移除 DKIM）

如果只用 SPF，需要修改代碼：

```javascript
// 在 auth-handlers.js 中
personalizations: [
  {
    to: [{ email: email, name: name || '太空探險家' }],
    // 移除 DKIM 相關配置
  },
],
```

---

## 🔍 驗證 DNS 設置

### 檢查 SPF 記錄

```bash
# macOS/Linux
dig TXT apcs.launchdock.app

# 或使用線上工具
# https://mxtoolbox.com/spf.aspx
```

**預期結果**:
```
apcs.launchdock.app. 3600 IN TXT "v=spf1 include:relay.mailchannels.net ~all"
```

### 檢查 DKIM 記錄

```bash
dig TXT mailchannels._domainkey.apcs.launchdock.app
```

**預期結果**:
```
mailchannels._domainkey.apcs.launchdock.app. 3600 IN TXT "v=DKIM1; k=rsa; p=..."
```

---

## 📝 完整設置步驟

### 步驟 1：設置 SPF 記錄
1. 登入 DNS 管理面板
2. 添加 TXT 記錄（SPF）
3. 等待 DNS 生效

### 步驟 2：生成並設置 DKIM（可選）
1. 生成 DKIM 密鑰對
2. 添加 DKIM DNS 記錄
3. 設置 Worker Secret

### 步驟 3：部署並測試
```bash
cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
wrangler deploy
```

### 步驟 4：測試發送
```bash
curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"test123456","name":"測試"}'
```

---

## ⚠️ 常見問題

### Q: DNS 記錄多久生效？
A: 通常 5-30 分鐘，最長可能需要 24-48 小時

### Q: 如何知道 DNS 已生效？
A: 使用 `dig` 命令或線上工具檢查

### Q: 沒有 DKIM 可以發送嗎？
A: 可以，但送達率可能較低，建議設置

### Q: Email 進入垃圾郵件怎麼辦？
A: 
1. 確認 SPF 和 DKIM 都設置正確
2. 添加 DMARC 記錄
3. 避免使用過多垃圾郵件關鍵字
4. 讓用戶將你的郵箱加入白名單

---

## 🎯 推薦配置

**最佳實踐**:
- ✅ SPF 記錄（必需）
- ✅ DKIM 記錄（強烈推薦）
- ✅ DMARC 記錄（推薦）

這樣可以獲得最高的送達率！📧

---

## 📚 參考資源

- [MailChannels 文檔](https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413)
- [SPF 記錄說明](https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/)
- [DKIM 記錄說明](https://www.cloudflare.com/learning/dns/dns-records/dns-dkim-record/)
- [DMARC 記錄說明](https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/)

---

**準備好了嗎？開始設置 DNS 記錄！** 🚀
