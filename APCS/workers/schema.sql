-- Cloudflare D1 數據庫 Schema
-- 用於儲存兌換碼和用戶訪問記錄

-- 兌換碼表
CREATE TABLE IF NOT EXISTS redemption_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL,  -- 'earlybird' 或 'full'
    used INTEGER DEFAULT 0,  -- 0 = 未使用, 1 = 已使用
    created_at TEXT DEFAULT (datetime('now')),
    used_at TEXT,
    user_ip TEXT,
    user_email TEXT
);

-- 創建索引加速查詢
CREATE INDEX IF NOT EXISTS idx_code ON redemption_codes(code);
CREATE INDEX IF NOT EXISTS idx_used ON redemption_codes(used);

-- 用戶訪問記錄表
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    accessed_at TEXT DEFAULT (datetime('now')),
    user_ip TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_token ON access_logs(token);
CREATE INDEX IF NOT EXISTS idx_lesson ON access_logs(lesson_id);

-- 插入測試兌換碼
INSERT INTO redemption_codes (code, plan) VALUES 
    ('APCS2024-DEMO01', 'full'),
    ('APCS2024-DEMO02', 'full'),
    ('APCS2024-DEMO03', 'earlybird'),
    ('APCS2024-TEST01', 'full'),
    ('APCS2024-TEST02', 'earlybird');

-- 查詢統計
-- 總兌換碼數量
-- SELECT COUNT(*) as total FROM redemption_codes;

-- 已使用的兌換碼
-- SELECT COUNT(*) as used FROM redemption_codes WHERE used = 1;

-- 最近使用的兌換碼
-- SELECT * FROM redemption_codes WHERE used = 1 ORDER BY used_at DESC LIMIT 10;
