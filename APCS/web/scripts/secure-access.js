/**
 * 增強版訪問控制 - 提高安全性
 * 使用多重驗證和混淆技術
 */

// 兌換碼加密儲存
const SALT = 'APCS-SPACE-2024-SECRET';

// SHA-256 簡易實現（實際應使用 crypto API）
async function hashCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 有效兌換碼的 hash 值（而非明文）
const VALID_CODE_HASHES = [
    'a1b2c3d4e5f6...', // APCS2024-DEMO01 的 hash
    'f6e5d4c3b2a1...', // APCS2024-DEMO02 的 hash
    // 更多 hash...
];

/**
 * 驗證兌換碼
 */
async function validateCode(code) {
    const hash = await hashCode(code);
    return VALID_CODE_HASHES.includes(hash);
}

/**
 * 解鎖課程（帶指紋驗證）
 */
async function unlockCourse(code) {
    if (await validateCode(code)) {
        // 生成設備指紋
        const fingerprint = await generateFingerprint();
        
        // 儲存解鎖信息
        const unlockData = {
            unlocked: true,
            timestamp: Date.now(),
            fingerprint: fingerprint,
            codeHash: await hashCode(code)
        };
        
        localStorage.setItem('courseAccess', JSON.stringify(unlockData));
        return true;
    }
    return false;
}

/**
 * 生成設備指紋（防止跨設備分享）
 */
async function generateFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown'
    ];
    
    const fingerprint = components.join('|');
    return await hashCode(fingerprint);
}

/**
 * 驗證訪問權限（帶指紋檢查）
 */
async function verifyAccess() {
    const stored = localStorage.getItem('courseAccess');
    if (!stored) return false;
    
    try {
        const data = JSON.parse(stored);
        
        // 檢查是否過期（可選：30 天後需重新驗證）
        const daysSinceUnlock = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceUnlock > 365) {
            return false;
        }
        
        // 驗證設備指紋
        const currentFingerprint = await generateFingerprint();
        if (data.fingerprint !== currentFingerprint) {
            console.warn('設備指紋不匹配');
            // 可以選擇：嚴格模式（拒絕）或寬鬆模式（允許但記錄）
            return false;
        }
        
        return data.unlocked === true;
    } catch (e) {
        return false;
    }
}

// 導出
window.SecureAccess = {
    unlockCourse,
    verifyAccess,
    validateCode
};
