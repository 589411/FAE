/**
 * 認證處理函數
 * Email 註冊、登入、Google OAuth
 */

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
  
  // TODO: 發送驗證 Email（需要 Email 服務）
  console.log(`驗證碼: ${verificationCode} (Email: ${email})`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: '註冊成功！請查收驗證 Email',
    userId: userId,
    // 開發環境下返回驗證碼（生產環境應移除）
    verificationCode: verificationCode
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
