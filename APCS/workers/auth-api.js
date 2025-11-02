/**
 * Cloudflare Workers - 會員認證 API
 * 部署到 Cloudflare Workers，配合 Pages 使用
 */

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
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
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
 */
async function handleCheckLesson(request, env, corsHeaders) {
  const { token, tokenId, lessonId, deviceId } = await request.json();
  
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
  
  // 檢查 token 和 tokenId
  if (!token || !tokenId || !deviceId) {
    return new Response(JSON.stringify({ 
      canAccess: false,
      reason: 'missing_credentials'
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
