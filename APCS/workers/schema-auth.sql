-- 會員系統數據庫結構
-- Cloudflare D1 Database Schema for Authentication

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,  -- 用於 Email 註冊（使用 bcrypt）
    google_id TEXT UNIQUE,  -- Google OAuth ID
    name TEXT,
    picture TEXT,  -- 頭像 URL
    email_verified INTEGER DEFAULT 0,  -- Email 是否已驗證
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    status TEXT DEFAULT 'active'  -- active, suspended, deleted
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 用戶兌換記錄
CREATE TABLE IF NOT EXISTS user_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    redemption_code_id INTEGER NOT NULL,  -- 關聯到 redemption_codes 表
    code TEXT NOT NULL,
    plan TEXT NOT NULL,
    redeemed_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,  -- 過期時間（1年後）
    status TEXT DEFAULT 'active',  -- active, expired, revoked
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (redemption_code_id) REFERENCES redemption_codes(id)
);

CREATE INDEX IF NOT EXISTS idx_user_redemptions_user_id ON user_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_redemptions_status ON user_redemptions(status);

-- 用戶設備
CREATE TABLE IF NOT EXISTS user_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,  -- 用戶自定義設備名稱
    device_fingerprint TEXT,  -- 設備指紋詳細資訊
    user_agent TEXT,
    ip_address TEXT,
    first_seen TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'active',  -- active, removed
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_device_unique ON user_devices(user_id, device_id);

-- Session 表（用於管理登入狀態）
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    last_activity TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Email 驗證碼表
CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);

-- 更新現有的 redemption_codes 表（添加 user_id）
-- ALTER TABLE redemption_codes ADD COLUMN user_id INTEGER;
-- ALTER TABLE redemption_codes ADD COLUMN redeemed_by_email TEXT;

-- 插入測試數據
-- 測試用戶（密碼: test123）
INSERT OR IGNORE INTO users (email, name, email_verified, status) 
VALUES ('test@example.com', '測試用戶', 1, 'active');

-- 查詢統計
-- 總用戶數
-- SELECT COUNT(*) as total_users FROM users WHERE status = 'active';

-- 已兌換用戶數
-- SELECT COUNT(DISTINCT user_id) as redeemed_users FROM user_redemptions WHERE status = 'active';

-- 活躍設備數
-- SELECT COUNT(*) as active_devices FROM user_devices WHERE status = 'active';

-- 用戶的設備列表
-- SELECT * FROM user_devices WHERE user_id = ? AND status = 'active' ORDER BY last_seen DESC;
