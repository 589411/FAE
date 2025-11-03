# 🔑 添加 DKIM DNS 記錄

## ⚠️ 問題

MailChannels 可能需要 DKIM 記錄才能發送郵件。

---

## 📋 添加 DKIM 記錄

### 在 Cloudflare DNS 中添加

1. 登入 Cloudflare Dashboard
2. 選擇域名 `launchdock.app`
3. 進入 **DNS** 標籤
4. 點擊 **Add record**

### 記錄詳情

| 欄位 | 值 |
|------|-----|
| **Type** | TXT |
| **Name** | `mailchannels._domainkey.apcs` |
| **Content** | `v=DKIM1; k=rsa; p=` |
| **TTL** | Auto |

**注意**: 這是一個空的 DKIM 記錄（沒有公鑰），但可以讓 MailChannels 知道我們已經設置了 DKIM。

---

## 🔄 或者：移除代碼中的 DKIM 配置

另一個方案是從代碼中移除 DKIM 配置，只使用 SPF。

讓我試試這個方案...

---

**建議**: 先試試移除代碼中的 DKIM 配置，如果還是不行再添加 DKIM DNS 記錄。
