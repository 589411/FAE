#!/bin/bash

# 清理測試用戶數據
# 用於開發測試時清理已註冊的測試帳號

echo "🗑️  清理測試數據..."

# 刪除測試用戶
wrangler d1 execute apcs-course-db --command "DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%589411%' OR email LIKE '%example.com'"

# 刪除測試驗證碼
wrangler d1 execute apcs-course-db --command "DELETE FROM email_verifications WHERE email LIKE '%test%' OR email LIKE '%589411%' OR email LIKE '%example.com'"

# 刪除測試 sessions
wrangler d1 execute apcs-course-db --command "DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)"

# 刪除測試設備
wrangler d1 execute apcs-course-db --command "DELETE FROM user_devices WHERE user_id NOT IN (SELECT id FROM users)"

echo "✅ 測試數據已清理完成！"
echo ""
echo "現在可以重新測試註冊了："
echo "curl -X POST https://apcs-auth-api.589411.workers.dev/api/auth/register \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"your-email@gmail.com\",\"password\":\"test123456\",\"name\":\"測試\"}'"
