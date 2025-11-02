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
  const { code } = await request.json();
  
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
  
  // 標記為已使用
  await env.DB.prepare(
    'UPDATE redemption_codes SET used = 1, used_at = ?, user_ip = ? WHERE code = ?'
  ).bind(
    new Date().toISOString(),
    request.headers.get('CF-Connecting-IP'),
    code
  ).run();
  
  // 生成訪問 token（JWT）
  const token = await generateToken(code, env);
  
  // 儲存到 KV（快速訪問）
  await env.COURSE_ACCESS.put(`token:${token}`, JSON.stringify({
    code: code,
    unlocked: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 年
  }), {
    expirationTtl: 365 * 24 * 60 * 60 // 1 年後自動刪除
  });
  
  return new Response(JSON.stringify({ 
    valid: true, 
    token: token,
    message: '解鎖成功！'
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
  const { token, lessonId } = await request.json();
  
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
  
  // 檢查 token
  if (!token) {
    return new Response(JSON.stringify({ 
      canAccess: false,
      reason: 'no_token'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const accessData = await env.COURSE_ACCESS.get(`token:${token}`, 'json');
  
  return new Response(JSON.stringify({ 
    canAccess: !!accessData && accessData.unlocked,
    reason: accessData ? 'unlocked' : 'invalid_token'
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
 * 生成訪問 token（簡化版 JWT）
 */
async function generateToken(code, env) {
  const data = {
    code: code,
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
