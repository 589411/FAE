/**
 * 頁面訪問保護
 * 在課程頁面載入時檢查訪問權限
 */

(function() {
    'use strict';
    
    // 當前頁面的課程 ID（從 URL 或 body 屬性獲取）
    function getCurrentCourseId() {
        // 從 body 的 data-course-id 屬性獲取
        const bodyId = document.body.getAttribute('data-course-id');
        if (bodyId) return bodyId;
        
        // 從 URL 路徑推斷（例如：/lessons/L2/B1.html -> B1）
        const path = window.location.pathname;
        const match = path.match(/\/([A-E]\d)\.html$/);
        return match ? match[1] : null;
    }
    
    // 免費課程列表
    const FREE_COURSES = ['A1', 'A2', 'A3'];
    
    // 檢查是否有訪問權限
    function checkAccess() {
        const courseId = getCurrentCourseId();
        
        // 如果無法識別課程 ID，允許訪問（避免誤擋）
        if (!courseId) {
            console.warn('無法識別課程 ID，允許訪問');
            return true;
        }
        
        // 免費課程，允許訪問
        if (FREE_COURSES.includes(courseId)) {
            console.log(`課程 ${courseId} 是免費課程，允許訪問`);
            return true;
        }
        
        // 付費課程，檢查是否已解鎖
        const accessToken = localStorage.getItem('accessToken');
        const unlockedCourses = JSON.parse(localStorage.getItem('unlockedCourses') || '[]');
        
        if (accessToken || unlockedCourses.includes(courseId)) {
            console.log(`課程 ${courseId} 已解鎖，允許訪問`);
            return true;
        }
        
        // 沒有權限
        console.log(`課程 ${courseId} 需要解鎖`);
        return false;
    }
    
    // 顯示付費牆
    function showPaywall(courseId) {
        // 隱藏主要內容
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // 創建付費牆
        const paywall = document.createElement('div');
        paywall.className = 'course-paywall';
        paywall.innerHTML = `
            <div class="paywall-content glass">
                <div class="paywall-icon">🔒</div>
                <h2 class="paywall-title">此課程需要解鎖</h2>
                <p class="paywall-desc">
                    課程 <strong>${courseId}</strong> 是付費內容<br>
                    請先解鎖完整課程以繼續學習
                </p>
                <div class="paywall-buttons">
                    <a href="../../pricing.html" class="btn btn-primary">
                        <span class="btn-icon">💰</span>
                        <span>查看方案</span>
                    </a>
                    <a href="../../unlock.html" class="btn btn-secondary">
                        <span class="btn-icon">🔑</span>
                        <span>輸入兌換碼</span>
                    </a>
                    <a href="../../index.html" class="btn btn-outline">
                        <span class="btn-icon">←</span>
                        <span>返回首頁</span>
                    </a>
                </div>
                <div class="paywall-info">
                    <p>💡 前 3 課（A1-A3）完全免費，歡迎體驗！</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(paywall);
        
        // 添加樣式
        const style = document.createElement('style');
        style.textContent = `
            .course-paywall {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            
            .paywall-content {
                max-width: 500px;
                padding: 3rem;
                text-align: center;
                animation: fadeInUp 0.5s ease-out;
            }
            
            .paywall-icon {
                font-size: 4rem;
                margin-bottom: 1.5rem;
                animation: pulse 2s infinite;
            }
            
            .paywall-title {
                font-size: 2rem;
                font-weight: 700;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .paywall-desc {
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 2rem;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .paywall-desc strong {
                color: #667eea;
                font-weight: 700;
            }
            
            .paywall-buttons {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .paywall-buttons .btn {
                width: 100%;
                justify-content: center;
            }
            
            .paywall-info {
                padding-top: 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .paywall-info p {
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.6);
                margin: 0;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 頁面載入時檢查
    function init() {
        // 等待 DOM 完全載入
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', performCheck);
        } else {
            performCheck();
        }
    }
    
    function performCheck() {
        const hasAccess = checkAccess();
        
        if (!hasAccess) {
            const courseId = getCurrentCourseId();
            showPaywall(courseId);
        }
    }
    
    // 立即執行
    init();
})();
