# 📧 明天待辦：Cloudflare Email 整合

## 🎯 目標
整合 Cloudflare Email Workers 來發送真實的驗證 Email

---

## 📋 準備工作

### 1. Cloudflare Email Routing 設置

**前置需求**：
- ✅ 已有 Cloudflare 帳號
- ⚠️ 需要自訂域名（例如：apcs.fae.academy）
- ⚠️ 域名的 DNS 需要託管在 Cloudflare

**設置步驟**：
1. 登入 Cloudflare Dashboard
2. 選擇你的域名
3. 進入 **Email** → **Email Routing**
4. 啟用 Email Routing
5. 設置 DNS 記錄（Cloudflare 會自動處理）
6. 驗證域名所有權

---

## 🔧 實作步驟

### 步驟 1：使用 MailChannels API

Cloudflare Workers 可以免費使用 MailChannels 發送 Email：

```javascript
// 在 auth-handlers.js 中添加
async function sendVerificationEmail(email, code) {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00d9ff, #7b2cbf); padding: 30px; text-align: center; color: white; }
    .content { background: #f9f9f9; padding: 30px; }
    .code { background: #00d9ff; color: white; font-size: 32px; font-weight: bold; padding: 15px; text-align: center; border-radius: 10px; margin: 20px 0; letter-spacing: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 APCS 太空探險課程</h1>
    </div>
    <div class="content">
      <h2>驗證您的 Email</h2>
      <p>感謝您註冊 APCS 太空探險課程！</p>
      <p>請使用以下驗證碼完成註冊：</p>
      <div class="code">${code}</div>
      <p>此驗證碼將在 <strong>30 分鐘</strong>後過期。</p>
      <p>如果您沒有註冊此帳號，請忽略此郵件。</p>
    </div>
    <div class="footer">
      <p>© 2024 APCS 太空探險課程</p>
      <p>這是一封自動發送的郵件，請勿回覆。</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
          },
        ],
        from: {
          email: 'noreply@your-domain.com',  // 改成你的域名
          name: 'APCS 太空探險課程',
        },
        subject: '驗證您的 APCS 帳號',
        content: [
          {
            type: 'text/html',
            value: emailContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}
```

### 步驟 2：更新註冊處理函數

```javascript
// 在 handleRegister 函數中
export async function handleRegister(request, env, corsHeaders) {
  // ... 現有代碼 ...
  
  // 發送驗證 Email
  const emailResult = await sendVerificationEmail(email, verificationCode);
  
  if (!emailResult.success) {
    console.error('Email 發送失敗:', emailResult.error);
    // 不影響註冊流程，只記錄錯誤
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: '註冊成功！請查收驗證 Email',
    userId: userId,
    // 生產環境：移除這行
    // verificationCode: verificationCode  // ← 刪除此行
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

### 步驟 3：更新前端（移除自動填入）

```javascript
// 在 login.html 中
async function handleRegister(event) {
  // ... 現有代碼 ...
  
  if (result.success) {
    currentEmail = email;
    
    showMessage('✅ 註冊成功！請查收 Email 驗證碼', 'success');
    
    // 顯示驗證區域
    document.getElementById('verificationSection').classList.add('active');
    
    // 生產環境：移除自動填入
    // if (result.verificationCode) {
    //   document.getElementById('verificationCode').value = result.verificationCode;
    // }
    
    btn.disabled = false;
  }
}
```

---

## 🧪 測試步驟

### 本地測試

1. 更新 `auth-handlers.js` 添加 Email 發送功能
2. 更新 `from.email` 為你的域名
3. 部署 Worker：
   ```bash
   cd /Users/yen-tangchang/Documents/github/FAE/APCS/workers
   wrangler deploy
   ```

4. 測試註冊：
   ```bash
   curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"your-real-email@gmail.com","password":"test123","name":"測試"}'
   ```

5. 檢查你的 Email 收件箱

### 驗證清單

- [ ] Email 成功送達
- [ ] Email 格式正確顯示
- [ ] 驗證碼正確
- [ ] 驗證碼可以成功驗證
- [ ] 驗證碼過期機制正常

---

## 🔐 安全性考量

### 生產環境檢查清單

- [ ] 移除 API 響應中的 `verificationCode`
- [ ] 移除前端自動填入驗證碼
- [ ] 設置 Email 發送頻率限制
- [ ] 添加驗證碼重發功能（限制次數）
- [ ] 記錄 Email 發送日誌
- [ ] 處理 Email 發送失敗情況

---

## 📝 替代方案

如果 Cloudflare Email 設置遇到問題，可以考慮：

### 方案 B：Resend（推薦備選）

**優點**：
- 不需要自訂域名
- 5 分鐘快速整合
- 免費 3,000 封/月

**設置**：
1. 註冊 https://resend.com
2. 獲取 API Key
3. 設置 Worker Secret：
   ```bash
   wrangler secret put RESEND_API_KEY
   ```
4. 使用 Resend API 發送

**代碼**：
```javascript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'APCS <noreply@resend.dev>',
    to: email,
    subject: '驗證您的 APCS 帳號',
    html: emailContent
  })
});
```

---

## 📚 參考資源

- [MailChannels API 文檔](https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Send-API)
- [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/)
- [Resend 文檔](https://resend.com/docs)

---

## 🎯 明天的工作流程

1. ☕ 早上：設置 Cloudflare Email Routing
2. 💻 上午：實作 Email 發送功能
3. 🧪 中午：測試 Email 發送
4. 🎨 下午：優化 Email 模板
5. ✅ 傍晚：完成測試並部署

---

**當前分支**: `feature/member-system`  
**當前狀態**: 會員系統基礎功能完成，等待 Email 整合  
**預計完成時間**: 2-3 小時

祝你今晚好眠！明天繼續加油！🚀
