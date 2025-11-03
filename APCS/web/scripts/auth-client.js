/**
 * 認證 API 客戶端
 * 處理用戶註冊、登入、驗證等功能
 */

const API_BASE_URL = 'https://apcs-auth-api.589411.workers.dev';

class AuthClient {
    constructor() {
        this.sessionToken = localStorage.getItem('sessionToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.deviceId = this.getDeviceId();
    }

    /**
     * 獲取或生成設備 ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                navigator.hardwareConcurrency || 'unknown',
                navigator.platform
            ].join('|');
            
            deviceId = 'dev_' + this.simpleHash(fingerprint);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * 簡單 hash 函數
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 用戶註冊
     */
    async register(email, password, name) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('註冊失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * 驗證 Email
     */
    async verifyEmail(email, code) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('驗證失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * 用戶登入
     */
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    deviceId: this.deviceId 
                })
            });

            const data = await response.json();
            
            if (data.success && data.sessionToken) {
                // 儲存登入資訊
                this.sessionToken = data.sessionToken;
                this.user = data.user;
                localStorage.setItem('sessionToken', data.sessionToken);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('登入失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * Google 登入
     */
    async googleLogin() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google/login`);
            const data = await response.json();
            
            if (data.success && data.authUrl) {
                // 在 URL 中加入 deviceId 作為 state
                const authUrl = data.authUrl + `&state=${this.deviceId}`;
                window.location.href = authUrl;
            }
            
            return data;
        } catch (error) {
            console.error('Google 登入失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * 登出
     */
    logout() {
        this.sessionToken = null;
        this.user = null;
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenId');
        localStorage.removeItem('unlockDate');
    }

    /**
     * 檢查是否已登入
     */
    isLoggedIn() {
        return !!this.sessionToken && !!this.user;
    }

    /**
     * 獲取當前用戶
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * 會員兌換課程碼
     */
    async redeemCode(code) {
        if (!this.sessionToken) {
            return { success: false, message: '請先登入' };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/redeem-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: code,
                    sessionToken: this.sessionToken
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('兌換失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * 查詢我的課程
     */
    async getMyCourses() {
        if (!this.sessionToken) {
            return { success: false, message: '請先登入' };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/my-courses`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('查詢課程失敗:', error);
            return { success: false, message: '網絡錯誤，請稍後再試' };
        }
    }

    /**
     * 驗證 Session 是否有效
     */
    async verifySession() {
        if (!this.sessionToken) {
            return { valid: false };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken: this.sessionToken })
            });

            const data = await response.json();
            
            if (data.valid && data.user) {
                // 更新本地用戶資訊
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('驗證 Session 失敗:', error);
            return { valid: false };
        }
    }
}

// 創建全局實例
window.authClient = new AuthClient();
