/**
 * API 客戶端 - 連接 Cloudflare Workers
 * 前端調用後端 API 進行會員驗證
 */

// API 端點（部署後需要更新）
const API_BASE_URL = 'https://apcs-auth.your-worker.workers.dev';

class CourseAPI {
    constructor() {
        this.token = localStorage.getItem('accessToken');
    }

    /**
     * 驗證兌換碼
     */
    async validateCode(code) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/validate-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (data.valid && data.token) {
                // 儲存 token
                this.token = data.token;
                localStorage.setItem('accessToken', data.token);
                localStorage.setItem('unlockDate', new Date().toISOString());
                return { success: true, message: data.message };
            }

            return { success: false, message: data.message };
        } catch (error) {
            console.error('驗證兌換碼失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * 驗證訪問權限
     */
    async verifyAccess() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/verify-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: this.token })
            });

            const data = await response.json();
            return data.hasAccess;
        } catch (error) {
            console.error('驗證訪問權限失敗:', error);
            return false;
        }
    }

    /**
     * 檢查特定課程訪問權限
     */
    async checkLessonAccess(lessonId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/check-lesson`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    token: this.token,
                    lessonId: lessonId 
                })
            });

            const data = await response.json();
            return data.canAccess;
        } catch (error) {
            console.error('檢查課程訪問失敗:', error);
            
            // 免費課程降級處理
            const freeLessons = ['A1', 'A2', 'A3'];
            return freeLessons.includes(lessonId);
        }
    }

    /**
     * 登出（清除 token）
     */
    logout() {
        this.token = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('unlockDate');
    }
}

// 創建全局實例
window.courseAPI = new CourseAPI();

/**
 * 增強版解鎖函數（使用 API）
 */
async function unlockCourseWithAPI() {
    const input = document.getElementById('codeInput');
    const code = input.value.trim().toUpperCase();
    const messageDiv = document.getElementById('message');

    if (!code) {
        showMessage('請輸入兌換碼', 'error');
        return;
    }

    // 顯示載入中
    showMessage('驗證中...', 'info');
    
    const result = await window.courseAPI.validateCode(code);

    if (result.success) {
        showMessage('✅ ' + result.message, 'success');
        
        // 3 秒後跳轉
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } else {
        showMessage('❌ ' + result.message, 'error');
        input.value = '';
        input.focus();
    }
}

/**
 * 頁面載入時驗證訪問權限
 */
async function initPageAccess() {
    // 獲取當前課程 ID
    const path = window.location.pathname;
    const match = path.match(/\/(A\d|B\d|C\d|D\d|E\d)\.html/);
    
    if (match) {
        const lessonId = match[1];
        const canAccess = await window.courseAPI.checkLessonAccess(lessonId);
        
        if (!canAccess) {
            showPaywallModal(lessonId);
        }
    }
}

/**
 * 顯示付費牆
 */
function showPaywallModal(lessonId) {
    const modal = document.createElement('div');
    modal.className = 'paywall-modal';
    modal.innerHTML = `
        <div class="paywall-content">
            <div class="paywall-icon">🔒</div>
            <h2>此課程需要解鎖</h2>
            <p>您正在嘗試訪問 <strong>${lessonId}</strong> 課程</p>
            <p>這是付費課程的一部分，需要先解鎖才能學習。</p>
            
            <div class="paywall-options">
                <button class="paywall-btn primary" onclick="window.location.href='../../pricing.html'">
                    查看定價方案
                </button>
                <button class="paywall-btn secondary" onclick="window.location.href='../../unlock.html'">
                    我有兌換碼
                </button>
                <button class="paywall-btn tertiary" onclick="window.location.href='../../index.html'">
                    返回首頁
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

/**
 * 在課程列表頁面應用鎖定狀態
 */
async function applyLockStatusWithAPI() {
    const lessonCards = document.querySelectorAll('.lesson-card');
    
    for (const card of lessonCards) {
        const lessonId = card.dataset.lessonId;
        if (!lessonId) continue;
        
        const canAccess = await window.courseAPI.checkLessonAccess(lessonId);
        
        if (!canAccess) {
            card.classList.add('locked');
            
            const overlay = document.createElement('div');
            overlay.className = 'lock-overlay';
            overlay.innerHTML = `
                <div class="lock-content">
                    <div class="lock-icon">🔒</div>
                    <h3>課程已鎖定</h3>
                    <p>解鎖後即可學習</p>
                    <button class="unlock-button" onclick="window.location.href='pricing.html'">
                        立即解鎖 NT$ 999
                    </button>
                </div>
            `;
            
            card.appendChild(overlay);
            
            const link = card.querySelector('a');
            if (link) {
                link.style.pointerEvents = 'none';
            }
        }
    }
}

// 頁面載入時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await initPageAccess();
        
        // 如果在課程列表頁
        if (document.querySelectorAll('.lesson-card').length > 0) {
            await applyLockStatusWithAPI();
        }
    });
} else {
    initPageAccess();
}
