/**
 * 認證處理函數
 * Email 註冊、登入、Google OAuth
 */

/**
 * 發送驗證 Email（使用 Resend API）
 * 需要設置環境變數: RESEND_API_KEY
 */
async function sendVerificationEmail(email, code, name, env) {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #00d9ff, #7b2cbf); 
      padding: 40px 30px; 
      text-align: center; 
      color: white; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content { 
      padding: 40px 30px;
      background: white;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
      font-size: 22px;
    }
    .content p {
      color: #666;
      font-size: 15px;
      line-height: 1.8;
    }
    .code-container {
      background: linear-gradient(135deg, #00d9ff, #00b8e6);
      border-radius: 10px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
    }
    .code { 
      color: white; 
      font-size: 36px; 
      font-weight: bold; 
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .code-label {
      color: white;
      font-size: 14px;
      margin-bottom: 10px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #00d9ff;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 5px 0;
      color: #555;
    }
    .footer { 
      text-align: center; 
      padding: 30px; 
      background: #f8f9fa;
      color: #999; 
      font-size: 13px;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
    .emoji {
      font-size: 24px;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><span class="emoji">🚀</span>APCS 太空探險課程</h1>
      <p>Future Astronaut Education</p>
    </div>
    <div class="content">
      <h2>👋 歡迎，${name || '太空探險家'}！</h2>
      <p>感謝您註冊 APCS 太空探險課程！我們很高興您加入我們的學習旅程。</p>
      <p>請使用以下驗證碼完成您的帳號驗證：</p>
      
      <div class="code-container">
        <div class="code-label">您的驗證碼</div>
        <div class="code">${code}</div>
      </div>
      
      <div class="info-box">
        <p><strong>⏰ 重要提醒：</strong></p>
        <p>• 此驗證碼將在 <strong>30 分鐘</strong>後過期</p>
        <p>• 請勿將驗證碼分享給任何人</p>
        <p>• 如果您沒有註冊此帳號，請忽略此郵件</p>
      </div>
      
      <p>完成驗證後，您將可以：</p>
      <p>✨ 訪問完整的課程內容<br>
      🎮 參與互動式學習任務<br>
      📊 追蹤您的學習進度<br>
      🏆 獲得成就徽章</p>
    </div>
    <div class="footer">
      <p><strong>© 2024 APCS 太空探險課程</strong></p>
      <p>這是一封自動發送的郵件，請勿回覆。</p>
      <p style="margin-top: 15px; color: #bbb;">Powered by Future Astronaut Education</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    // 檢查是否有 Resend API Key
    if (!env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY 未設置');
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`📧 準備發送 Email 至: ${email}`);
    console.log(`🔑 API Key 存在: ${env.RESEND_API_KEY ? 'Yes' : 'No'}`);

    const emailPayload = {
      from: 'APCS 太空探險課程 <noreply@apcs.launchdock.app>',
      to: [email],
      subject: '🚀 驗證您的 APCS 帳號',
      html: emailContent,
    };

    console.log(`📦 Email payload:`, JSON.stringify(emailPayload, null, 2));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log(`📡 Resend API 響應狀態: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error:', response.status, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(`Failed to send email: ${response.status} - ${errorData.message || errorText}`);
    }

    const result = await response.json();
    console.log(`✅ 驗證 Email 已發送至: ${email}, ID: ${result.id}`);
    return { success: true, emailId: result.id };
  } catch (error) {
    console.error('❌ Email 發送錯誤:', error.message);
    console.error('❌ 錯誤堆棧:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Email 註冊
 */
export async function handleRegister(request, env, corsHeaders) {
  const { email, password, name } = await request.json();
  
  // 驗證輸入
  if (!email || !password) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請提供 Email 和密碼' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 驗證 Email 格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Email 格式不正確' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 驗證密碼長度
  if (password.length < 6) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '密碼至少需要 6 個字符' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查 Email 是否已存在
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();
  
  if (existingUser) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '此 Email 已被註冊' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 生成密碼 hash（使用 Web Crypto API）
  const passwordHash = await hashPassword(password);
  
  // 創建用戶
  const result = await env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, email_verified) VALUES (?, ?, ?, 0)'
  ).bind(email, passwordHash, name || email.split('@')[0]).run();
  
  const userId = result.meta.last_row_id;
  
  // 生成驗證碼
  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30分鐘
  
  await env.DB.prepare(
    'INSERT INTO email_verifications (email, verification_code, expires_at) VALUES (?, ?, ?)'
  ).bind(email, verificationCode, expiresAt).run();
  
  // 發送驗證 Email
  const emailResult = await sendVerificationEmail(email, verificationCode, name, env);
  
  if (!emailResult.success) {
    console.error('❌ Email 發送失敗:', emailResult.error);
    // 不影響註冊流程，只記錄錯誤
    // 用戶仍然可以使用驗證碼（如果有其他方式獲取）
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: '註冊成功！請查收驗證 Email',
    userId: userId,
    emailSent: emailResult.success
    // 生產環境：已移除 verificationCode 返回
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Email 登入
 */
export async function handleLogin(request, env, corsHeaders) {
  const { email, password, deviceId } = await request.json();
  
  if (!email || !password || !deviceId) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請提供完整的登入資訊' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 查詢用戶
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND status = ?'
  ).bind(email, 'active').first();
  
  if (!user) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Email 或密碼錯誤' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 驗證密碼
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Email 或密碼錯誤' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查 Email 是否已驗證
  if (!user.email_verified) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請先驗證您的 Email',
      needVerification: true
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 創建 Session
  const sessionToken = await createSession(user.id, deviceId, request, env);
  
  // 更新最後登入時間
  await env.DB.prepare(
    'UPDATE users SET last_login = ? WHERE id = ?'
  ).bind(new Date().toISOString(), user.id).run();
  
  // 記錄/更新設備
  await recordDevice(user.id, deviceId, request, env);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: '登入成功',
    sessionToken: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 驗證 Email
 */
export async function handleVerifyEmail(request, env, corsHeaders) {
  const { email, code } = await request.json();
  
  if (!email || !code) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請提供 Email 和驗證碼' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 查詢驗證碼
  const verification = await env.DB.prepare(
    'SELECT * FROM email_verifications WHERE email = ? AND verification_code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1'
  ).bind(email, code).first();
  
  if (!verification) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '驗證碼無效' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查是否過期
  if (new Date(verification.expires_at) < new Date()) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '驗證碼已過期' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 標記驗證碼為已使用
  await env.DB.prepare(
    'UPDATE email_verifications SET used = 1 WHERE id = ?'
  ).bind(verification.id).run();
  
  // 更新用戶 Email 驗證狀態
  await env.DB.prepare(
    'UPDATE users SET email_verified = 1 WHERE email = ?'
  ).bind(email).run();
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Email 驗證成功！'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Google OAuth 登入（第一步：生成授權 URL）
 */
export async function handleGoogleLogin(request, env, corsHeaders) {
  const redirectUri = `${new URL(request.url).origin}/api/auth/google/callback`;
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid email profile')}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  return new Response(JSON.stringify({ 
    success: true,
    authUrl: authUrl
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Google OAuth 回調處理
 */
export async function handleGoogleCallback(request, env, corsHeaders) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const deviceId = url.searchParams.get('state'); // 使用 state 傳遞 deviceId
  
  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }
  
  // 交換 code 獲取 access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      grant_type: 'authorization_code'
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    return new Response('Failed to get access token', { status: 400 });
  }
  
  // 獲取用戶資訊
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  
  const userInfo = await userInfoResponse.json();
  
  // 查找或創建用戶
  let user = await env.DB.prepare(
    'SELECT * FROM users WHERE google_id = ?'
  ).bind(userInfo.id).first();
  
  if (!user) {
    // 檢查 Email 是否已存在
    user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(userInfo.email).first();
    
    if (user) {
      // 綁定 Google ID 到現有帳號
      await env.DB.prepare(
        'UPDATE users SET google_id = ?, picture = ?, email_verified = 1 WHERE id = ?'
      ).bind(userInfo.id, userInfo.picture, user.id).run();
    } else {
      // 創建新用戶
      const result = await env.DB.prepare(
        'INSERT INTO users (email, google_id, name, picture, email_verified) VALUES (?, ?, ?, ?, 1)'
      ).bind(userInfo.email, userInfo.id, userInfo.name, userInfo.picture).run();
      
      user = {
        id: result.meta.last_row_id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
    }
  }
  
  // 創建 Session
  const sessionToken = await createSession(user.id, deviceId, request, env);
  
  // 重定向到前端（帶上 session token）
  return Response.redirect(`${url.origin}/auth-success.html?token=${sessionToken}`, 302);
}

/**
 * 輔助函數：生成密碼 hash
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'apcs-salt-2024'); // 添加 salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 輔助函數：驗證密碼
 */
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * 輔助函數：生成驗證碼
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 輔助函數：創建 Session
 */
async function createSession(userId, deviceId, request, env) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天
  
  await env.DB.prepare(
    'INSERT INTO sessions (user_id, session_token, device_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    userId,
    sessionToken,
    deviceId,
    request.headers.get('CF-Connecting-IP'),
    request.headers.get('User-Agent'),
    expiresAt
  ).run();
  
  // 同時存到 KV 以加快查詢
  await env.COURSE_ACCESS.put(`session:${sessionToken}`, JSON.stringify({
    userId: userId,
    deviceId: deviceId,
    expiresAt: expiresAt
  }), {
    expirationTtl: 30 * 24 * 60 * 60
  });
  
  return sessionToken;
}

/**
 * 輔助函數：記錄設備
 */
async function recordDevice(userId, deviceId, request, env) {
  const existing = await env.DB.prepare(
    'SELECT * FROM user_devices WHERE user_id = ? AND device_id = ?'
  ).bind(userId, deviceId).first();
  
  if (existing) {
    // 更新最後使用時間
    await env.DB.prepare(
      'UPDATE user_devices SET last_seen = ?, ip_address = ?, user_agent = ? WHERE id = ?'
    ).bind(
      new Date().toISOString(),
      request.headers.get('CF-Connecting-IP'),
      request.headers.get('User-Agent'),
      existing.id
    ).run();
  } else {
    // 新增設備
    await env.DB.prepare(
      'INSERT INTO user_devices (user_id, device_id, user_agent, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      deviceId,
      request.headers.get('User-Agent'),
      request.headers.get('CF-Connecting-IP')
    ).run();
  }
}
