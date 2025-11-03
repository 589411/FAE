/**
 * Cloudflare Workers - 會員認證 API
 * 部署到 Cloudflare Workers，配合 Pages 使用
 */

import {
  handleRegister,
  handleLogin,
  handleVerifyEmail,
  handleGoogleLogin,
  handleGoogleCallback
} from './auth-handlers.js';

export default {
  async fetch(request, env) {
    // CORS 設置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 處理 OPTIONS 請求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 路由處理
      
      // 健康檢查
      if (path === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ 
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // 認證相關路由
      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/verify-email' && request.method === 'POST') {
        return await handleVerifyEmail(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/google/login' && request.method === 'GET') {
        return await handleGoogleLogin(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/google/callback' && request.method === 'GET') {
        return await handleGoogleCallback(request, env, corsHeaders);
      }
      
      // 會員兌換課程碼（需要登入）
      if (path === '/api/auth/redeem-code' && request.method === 'POST') {
        return await handleRedeemCode(request, env, corsHeaders);
      }
      
      // 查詢我的課程（需要登入）
      if (path === '/api/auth/my-courses' && request.method === 'GET') {
        return await handleMyCourses(request, env, corsHeaders);
      }
      
      // 驗證 Session Token
      if (path === '/api/auth/verify-session' && request.method === 'POST') {
        return await handleVerifySession(request, env, corsHeaders);
      }
      
      // 原有的兌換碼相關路由
      if (path === '/api/validate-code' && request.method === 'POST') {
        return await handleValidateCode(request, env, corsHeaders);
      }
      
      if (path === '/api/verify-access' && request.method === 'POST') {
        return await handleVerifyAccess(request, env, corsHeaders);
      }
      
      if (path === '/api/check-lesson' && request.method === 'POST') {
        return await handleCheckLesson(request, env, corsHeaders);
      }
      
      if (path === '/api/verify-token' && request.method === 'POST') {
        return await handleVerifyToken(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 驗證兌換碼
 */
async function handleValidateCode(request, env, corsHeaders) {
  const { code, deviceId } = await request.json();
  
  if (!deviceId) {
    return new Response(JSON.stringify({ 
      valid: false, 
      message: '缺少設備識別碼' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 從 D1 數據庫查詢兌換碼
  const result = await env.DB.prepare(
    'SELECT * FROM redemption_codes WHERE code = ? AND used = 0'
  ).bind(code).first();
  
  if (!result) {
    return new Response(JSON.stringify({ 
      valid: false, 
      message: '兌換碼無效或已使用' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 標記為已使用，並記錄首次使用的設備
  await env.DB.prepare(
    'UPDATE redemption_codes SET used = 1, used_at = ?, user_ip = ?, device_id = ? WHERE code = ?'
  ).bind(
    new Date().toISOString(),
    request.headers.get('CF-Connecting-IP'),
    deviceId,
    code
  ).run();
  
  // 生成訪問 token（使用隨機 ID，不包含兌換碼）
  const tokenId = crypto.randomUUID();
  const token = await generateToken(tokenId, deviceId, env);
  
  // 儲存到 KV（快速訪問）
  await env.COURSE_ACCESS.put(`token:${tokenId}`, JSON.stringify({
    code: code,  // 兌換碼存在服務器端
    devices: [deviceId],  // 已授權的設備列表
    maxDevices: result.max_devices || 3,  // 最大設備數
    unlocked: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 年
  }), {
    expirationTtl: 365 * 24 * 60 * 60 // 1 年後自動刪除
  });
  
  return new Response(JSON.stringify({ 
    valid: true, 
    token: token,
    tokenId: tokenId,
    message: '解鎖成功！此帳號最多可在 ' + (result.max_devices || 3) + ' 台設備使用'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 驗證訪問權限
 */
async function handleVerifyAccess(request, env, corsHeaders) {
  const { token } = await request.json();
  
  if (!token) {
    return new Response(JSON.stringify({ hasAccess: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 從 KV 查詢 token
  const accessData = await env.COURSE_ACCESS.get(`token:${token}`, 'json');
  
  if (!accessData) {
    return new Response(JSON.stringify({ hasAccess: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查是否過期
  if (accessData.expiresAt < Date.now()) {
    return new Response(JSON.stringify({ 
      hasAccess: false,
      message: '訪問已過期'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ 
    hasAccess: true,
    unlockDate: new Date(accessData.timestamp).toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 檢查特定課程訪問權限
 * 支援兩種方式：
 * 1. Session Token（會員系統）
 * 2. Access Token（舊的兌換碼系統）
 */
async function handleCheckLesson(request, env, corsHeaders) {
  const { token, tokenId, lessonId, deviceId, sessionToken } = await request.json();
  
  // 免費課程
  const freeLessons = ['A1', 'A2', 'A3'];
  if (freeLessons.includes(lessonId)) {
    return new Response(JSON.stringify({ 
      canAccess: true,
      reason: 'free'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 方式 1：使用 Session Token（會員系統）
  if (sessionToken) {
    const session = await verifySessionToken(sessionToken, env);
    
    if (!session) {
      return new Response(JSON.stringify({ 
        canAccess: false,
        reason: 'invalid_session',
        message: '請重新登入'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 查詢用戶的課程權限
    const courses = await env.COURSE_ACCESS.get(`user_courses:${session.userId}`, 'json');
    
    if (!courses || courses.length === 0) {
      // 沒有兌換任何課程
      return new Response(JSON.stringify({ 
        canAccess: false,
        reason: 'no_courses',
        message: '請先兌換課程碼'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 檢查是否有 full 方案（可訪問所有課程）
    const hasFullAccess = courses.some(c => c.plan === 'full' && new Date(c.expiresAt) > new Date());
    
    if (hasFullAccess) {
      // 記錄訪問日誌
      await env.DB.prepare(
        'INSERT INTO access_logs (token, lesson_id, user_ip, user_agent) VALUES (?, ?, ?, ?)'
      ).bind(
        `user:${session.userId}`,
        lessonId,
        request.headers.get('CF-Connecting-IP'),
        request.headers.get('User-Agent')
      ).run();
      
      return new Response(JSON.stringify({ 
        canAccess: true,
        reason: 'member',
        plan: 'full'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 沒有 full 方案
    return new Response(JSON.stringify({ 
      canAccess: false,
      reason: 'plan_required',
      message: '需要完整方案才能訪問此課程'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 方式 2：使用 Access Token（舊的兌換碼系統，向後兼容）
  if (!token || !tokenId || !deviceId) {
    return new Response(JSON.stringify({ 
      canAccess: false,
      reason: 'missing_credentials',
      message: '請先登入或兌換課程碼'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 驗證 token 簽名
  const isValidToken = await verifyToken(token, tokenId, deviceId, env);
  if (!isValidToken) {
    return new Response(JSON.stringify({ 
      canAccess: false,
      reason: 'invalid_token'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 從 KV 獲取訪問數據
  const accessData = await env.COURSE_ACCESS.get(`token:${tokenId}`, 'json');
  
  if (!accessData || !accessData.unlocked) {
    return new Response(JSON.stringify({ 
      canAccess: false,
      reason: 'no_access_data'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查設備是否已授權
  if (!accessData.devices.includes(deviceId)) {
    // 檢查是否達到最大設備數
    if (accessData.devices.length >= accessData.maxDevices) {
      return new Response(JSON.stringify({ 
        canAccess: false,
        reason: 'max_devices_reached',
        message: `已達到最大設備數限制（${accessData.maxDevices}台）`,
        currentDevices: accessData.devices.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 添加新設備
    accessData.devices.push(deviceId);
    await env.COURSE_ACCESS.put(`token:${tokenId}`, JSON.stringify(accessData), {
      expirationTtl: 365 * 24 * 60 * 60
    });
  }
  
  // 記錄訪問日誌
  await env.DB.prepare(
    'INSERT INTO access_logs (token, lesson_id, user_ip, user_agent) VALUES (?, ?, ?, ?)'
  ).bind(
    tokenId,
    lessonId,
    request.headers.get('CF-Connecting-IP'),
    request.headers.get('User-Agent')
  ).run();
  
  return new Response(JSON.stringify({ 
    canAccess: true,
    reason: 'unlocked',
    devicesUsed: accessData.devices.length,
    maxDevices: accessData.maxDevices
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 驗證 Token
 */
async function handleVerifyToken(request, env, corsHeaders) {
  const { token } = await request.json();
  
  if (!token) {
    return new Response(JSON.stringify({ 
      valid: false,
      message: '未提供 Token'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 從 KV 查詢 token
  const accessData = await env.COURSE_ACCESS.get(`token:${token}`, 'json');
  
  if (!accessData) {
    return new Response(JSON.stringify({ 
      valid: false,
      message: 'Token 無效'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查是否過期
  if (accessData.expiresAt < Date.now()) {
    return new Response(JSON.stringify({ 
      valid: false,
      message: 'Token 已過期'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ 
    valid: true,
    message: 'Token 有效',
    unlockDate: new Date(accessData.timestamp).toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 生成訪問 token（不包含兌換碼，綁定設備）
 */
async function generateToken(tokenId, deviceId, env) {
  const data = {
    tokenId: tokenId,  // 使用隨機 UUID，不包含兌換碼
    deviceId: deviceId,  // 綁定設備
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2)
  };
  
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);
  
  // 使用 Web Crypto API 生成簽名
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.JWT_SECRET || 'default-secret-change-me'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Base64 編碼
  const token = btoa(dataString) + '.' + signatureHex;
  return token;
}

/**
 * 驗證 token 簽名
 */
async function verifyToken(token, expectedTokenId, expectedDeviceId, env) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    
    const dataString = atob(parts[0]);
    const data = JSON.parse(dataString);
    
    // 只驗證 tokenId（deviceId 在後續檢查設備列表時驗證）
    if (data.tokenId !== expectedTokenId) {
      return false;
    }
    
    // 驗證簽名
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.JWT_SECRET || 'default-secret-change-me'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureHex = parts[1];
    const signatureArray = new Uint8Array(signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      dataBuffer
    );
    
    return isValid;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * 驗證 Session Token 並獲取用戶資訊
 */
async function verifySessionToken(sessionToken, env) {
  if (!sessionToken) return null;
  
  // 先從 KV 快取查詢
  const sessionData = await env.COURSE_ACCESS.get(`session:${sessionToken}`, 'json');
  
  if (sessionData) {
    // 檢查是否過期
    if (new Date(sessionData.expiresAt) > new Date()) {
      return sessionData;
    }
  }
  
  // KV 沒有或過期，從 D1 查詢
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime("now")'
  ).bind(sessionToken).first();
  
  if (!session) return null;
  
  // 更新 KV 快取
  await env.COURSE_ACCESS.put(`session:${sessionToken}`, JSON.stringify({
    userId: session.user_id,
    deviceId: session.device_id,
    expiresAt: session.expires_at
  }), {
    expirationTtl: 30 * 24 * 60 * 60
  });
  
  return {
    userId: session.user_id,
    deviceId: session.device_id,
    expiresAt: session.expires_at
  };
}

/**
 * 會員兌換課程碼
 */
async function handleRedeemCode(request, env, corsHeaders) {
  const { code, sessionToken } = await request.json();
  
  if (!code || !sessionToken) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請提供兌換碼和登入憑證' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 驗證 Session
  const session = await verifySessionToken(sessionToken, env);
  if (!session) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請先登入' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 查詢兌換碼
  const redemptionCode = await env.DB.prepare(
    'SELECT * FROM redemption_codes WHERE code = ? AND used = 0'
  ).bind(code).first();
  
  if (!redemptionCode) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '兌換碼無效或已使用' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 檢查用戶是否已兌換過此碼
  const existingRedemption = await env.DB.prepare(
    'SELECT * FROM user_redemptions WHERE user_id = ? AND code = ?'
  ).bind(session.userId, code).first();
  
  if (existingRedemption) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '您已經兌換過此課程碼' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 標記兌換碼為已使用
  await env.DB.prepare(
    'UPDATE redemption_codes SET used = 1, used_at = ?, user_ip = ?, device_id = ? WHERE code = ?'
  ).bind(
    new Date().toISOString(),
    request.headers.get('CF-Connecting-IP'),
    session.deviceId,
    code
  ).run();
  
  // 創建用戶兌換記錄
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1年
  await env.DB.prepare(
    'INSERT INTO user_redemptions (user_id, redemption_code_id, code, plan, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    session.userId,
    redemptionCode.id,
    code,
    redemptionCode.plan || 'full',
    expiresAt
  ).run();
  
  // 同時保存到 KV 以加快查詢（使用 userId 作為 key）
  const userCourses = await env.COURSE_ACCESS.get(`user_courses:${session.userId}`, 'json') || [];
  userCourses.push({
    code: code,
    plan: redemptionCode.plan || 'full',
    redeemedAt: new Date().toISOString(),
    expiresAt: expiresAt
  });
  await env.COURSE_ACCESS.put(`user_courses:${session.userId}`, JSON.stringify(userCourses), {
    expirationTtl: 365 * 24 * 60 * 60
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: '兌換成功！課程已解鎖',
    plan: redemptionCode.plan || 'full',
    expiresAt: expiresAt
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 查詢我的課程
 */
async function handleMyCourses(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  const sessionToken = authHeader?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '請先登入' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 驗證 Session
  const session = await verifySessionToken(sessionToken, env);
  if (!session) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: '登入已過期，請重新登入' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 先從 KV 快取查詢
  let courses = await env.COURSE_ACCESS.get(`user_courses:${session.userId}`, 'json');
  
  if (!courses) {
    // KV 沒有，從 D1 查詢
    const result = await env.DB.prepare(
      'SELECT * FROM user_redemptions WHERE user_id = ? AND status = ? AND expires_at > datetime("now") ORDER BY redeemed_at DESC'
    ).bind(session.userId, 'active').all();
    
    courses = result.results.map(r => ({
      code: r.code,
      plan: r.plan,
      redeemedAt: r.redeemed_at,
      expiresAt: r.expires_at
    }));
    
    // 更新 KV 快取
    if (courses.length > 0) {
      await env.COURSE_ACCESS.put(`user_courses:${session.userId}`, JSON.stringify(courses), {
        expirationTtl: 365 * 24 * 60 * 60
      });
    }
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    courses: courses || [],
    hasFullAccess: courses && courses.some(c => c.plan === 'full')
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 驗證 Session Token
 */
async function handleVerifySession(request, env, corsHeaders) {
  const { sessionToken } = await request.json();
  
  if (!sessionToken) {
    return new Response(JSON.stringify({ 
      valid: false, 
      message: '未提供 Session Token' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const session = await verifySessionToken(sessionToken, env);
  
  if (!session) {
    return new Response(JSON.stringify({ 
      valid: false, 
      message: 'Session 無效或已過期' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // 獲取用戶資訊
  const user = await env.DB.prepare(
    'SELECT id, email, name, picture FROM users WHERE id = ?'
  ).bind(session.userId).first();
  
  return new Response(JSON.stringify({ 
    valid: true, 
    user: user,
    expiresAt: session.expiresAt
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
