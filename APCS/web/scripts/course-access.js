/**
 * APCS 太空探險課程 - 訪問控制系統
 * 管理免費課程和付費課程的訪問權限
 */

// 免費課程列表
const FREE_LESSONS = ['A1', 'A2', 'A3'];

// 所有課程列表
const ALL_LESSONS = ['A1', 'A2', 'A3', 'B1', 'B2', 'C1', 'C2', 'D1', 'E1'];

/**
 * 檢查用戶是否已解鎖完整課程
 */
function isUnlocked() {
    return localStorage.getItem('courseUnlocked') === 'true';
}

/**
 * 檢查特定課程是否可訪問
 */
function canAccessLesson(lessonId) {
    // 免費課程始終可訪問
    if (FREE_LESSONS.includes(lessonId)) {
        return true;
    }
    
    // 檢查是否已解鎖
    return isUnlocked();
}

/**
 * 獲取解鎖信息
 */
function getUnlockInfo() {
    if (!isUnlocked()) {
        return null;
    }
    
    return {
        code: localStorage.getItem('unlockCode'),
        date: localStorage.getItem('unlockDate'),
        unlocked: true
    };
}

/**
 * 在課程卡片上添加鎖定狀態
 */
function applyLockStatus() {
    const lessonCards = document.querySelectorAll('.lesson-card');
    
    lessonCards.forEach(card => {
        const lessonId = card.dataset.lessonId;
        
        if (!lessonId) return;
        
        if (!canAccessLesson(lessonId)) {
            // 添加鎖定樣式
            card.classList.add('locked');
            
            // 創建鎖定覆蓋層
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
            
            // 禁用點擊
            const link = card.querySelector('a');
            if (link) {
                link.style.pointerEvents = 'none';
            }
        }
    });
}

/**
 * 顯示解鎖狀態橫幅
 */
function showUnlockBanner() {
    const info = getUnlockInfo();
    
    if (info) {
        const banner = document.createElement('div');
        banner.className = 'unlock-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <span class="banner-icon">✅</span>
                <span>您已解鎖完整課程！</span>
                <span class="banner-date">解鎖於 ${new Date(info.date).toLocaleDateString('zh-TW')}</span>
            </div>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
    }
}

/**
 * 檢查當前頁面訪問權限
 */
function checkPageAccess() {
    // 從 URL 獲取當前課程 ID
    const path = window.location.pathname;
    const match = path.match(/\/(A\d|B\d|C\d|D\d|E\d)\.html/);
    
    if (match) {
        const lessonId = match[1];
        
        if (!canAccessLesson(lessonId)) {
            // 顯示付費牆
            showPaywall(lessonId);
        }
    }
}

/**
 * 顯示付費牆
 */
function showPaywall(lessonId) {
    const paywall = document.createElement('div');
    paywall.className = 'paywall-modal';
    paywall.innerHTML = `
        <div class="paywall-content">
            <div class="paywall-icon">🔒</div>
            <h2>此課程需要解鎖</h2>
            <p>您正在嘗試訪問 <strong>${lessonId}</strong> 課程</p>
            <p>這是付費課程的一部分，需要先解鎖才能學習。</p>
            
            <div class="paywall-options">
                <button class="paywall-btn primary" onclick="window.location.href='../pricing.html'">
                    查看定價方案
                </button>
                <button class="paywall-btn secondary" onclick="window.location.href='../unlock.html'">
                    我有兌換碼
                </button>
                <button class="paywall-btn tertiary" onclick="window.location.href='../index.html'">
                    返回首頁
                </button>
            </div>
            
            <div class="paywall-features">
                <h3>解鎖後您將獲得：</h3>
                <ul>
                    <li>✅ 全部 9 個完整課程</li>
                    <li>✅ 50+ 程式碼範例</li>
                    <li>✅ 30+ 互動式 Quiz</li>
                    <li>✅ 終身訪問權限</li>
                </ul>
            </div>
        </div>
    `;
    
    document.body.appendChild(paywall);
    
    // 禁止滾動
    document.body.style.overflow = 'hidden';
}

/**
 * 獲取學習進度
 */
function getLearningProgress() {
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    const accessible = ALL_LESSONS.filter(id => canAccessLesson(id));
    
    return {
        total: accessible.length,
        completed: completed.filter(id => accessible.includes(id)).length,
        percentage: Math.round((completed.length / accessible.length) * 100) || 0
    };
}

/**
 * 標記課程為已完成
 */
function markLessonComplete(lessonId) {
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    
    if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        localStorage.setItem('completedLessons', JSON.stringify(completed));
    }
}

/**
 * 初始化訪問控制
 */
function initAccessControl() {
    // 檢查頁面訪問權限
    checkPageAccess();
    
    // 應用鎖定狀態（如果在課程列表頁）
    if (document.querySelectorAll('.lesson-card').length > 0) {
        applyLockStatus();
    }
    
    // 顯示解鎖橫幅
    showUnlockBanner();
}

// 頁面加載時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessControl);
} else {
    initAccessControl();
}

// 導出函數供其他腳本使用
window.CourseAccess = {
    isUnlocked,
    canAccessLesson,
    getUnlockInfo,
    getLearningProgress,
    markLessonComplete,
    FREE_LESSONS,
    ALL_LESSONS
};
