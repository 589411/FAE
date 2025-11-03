#!/bin/bash

# 本地測試腳本
# 測試會員系統整合功能

echo "🧪 APCS 會員系統本地測試"
echo "================================"
echo ""

# 檢查 wrangler 是否安裝
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler 未安裝"
    echo "請執行: npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler 已安裝"
echo ""

# 設置測試 URL
if [ -z "$1" ]; then
    API_URL="http://localhost:8787"
    echo "📍 使用本地測試 URL: $API_URL"
    echo "   (如果要測試生產環境，請提供 URL 作為參數)"
else
    API_URL="$1"
    echo "📍 使用測試 URL: $API_URL"
fi

echo ""
echo "================================"
echo ""

# 測試 1: 健康檢查
echo "測試 1: 健康檢查"
echo "--------------------------------"
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ 健康檢查通過"
else
    echo "❌ 健康檢查失敗"
    exit 1
fi

echo ""

# 測試 2: 註冊新用戶
echo "測試 2: 註冊新用戶"
echo "--------------------------------"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="test123456"
TEST_NAME="測試用戶"

echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo "Name: $TEST_NAME"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"$TEST_NAME\"
  }")

echo "Response: $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 註冊成功"
    
    # 提取驗證碼（如果在開發環境返回）
    VERIFICATION_CODE=$(echo "$REGISTER_RESPONSE" | grep -o '"verificationCode":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$VERIFICATION_CODE" ]; then
        echo "📧 驗證碼: $VERIFICATION_CODE"
    fi
else
    echo "❌ 註冊失敗"
    exit 1
fi

echo ""

# 測試 3: Email 驗證（如果有驗證碼）
if [ -n "$VERIFICATION_CODE" ]; then
    echo "測試 3: Email 驗證"
    echo "--------------------------------"
    
    VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/verify-email" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TEST_EMAIL\",
        \"code\": \"$VERIFICATION_CODE\"
      }")
    
    echo "Response: $VERIFY_RESPONSE"
    
    if echo "$VERIFY_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Email 驗證成功"
    else
        echo "⚠️  Email 驗證失敗（可能需要手動驗證）"
    fi
    
    echo ""
fi

# 測試 4: 登入
echo "測試 4: 用戶登入"
echo "--------------------------------"

# 生成設備 ID
DEVICE_ID="test_device_$(date +%s)"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"deviceId\": \"$DEVICE_ID\"
  }")

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 登入成功"
    
    # 提取 Session Token
    SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 Session Token: ${SESSION_TOKEN:0:20}..."
else
    echo "❌ 登入失敗"
    echo "⚠️  可能需要先驗證 Email"
    exit 1
fi

echo ""

# 測試 5: 驗證 Session
echo "測試 5: 驗證 Session Token"
echo "--------------------------------"

VERIFY_SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/verify-session" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionToken\": \"$SESSION_TOKEN\"
  }")

echo "Response: $VERIFY_SESSION_RESPONSE"

if echo "$VERIFY_SESSION_RESPONSE" | grep -q "valid.*true"; then
    echo "✅ Session Token 有效"
else
    echo "❌ Session Token 無效"
    exit 1
fi

echo ""

# 測試 6: 兌換課程碼
echo "測試 6: 會員兌換課程碼"
echo "--------------------------------"

TEST_CODE="APCS2024-DEMO01"
echo "兌換碼: $TEST_CODE"

REDEEM_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/redeem-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"$TEST_CODE\",
    \"sessionToken\": \"$SESSION_TOKEN\"
  }")

echo "Response: $REDEEM_RESPONSE"

if echo "$REDEEM_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 兌換成功"
elif echo "$REDEEM_RESPONSE" | grep -q "已經兌換過"; then
    echo "⚠️  此碼已被兌換過"
elif echo "$REDEEM_RESPONSE" | grep -q "無效或已使用"; then
    echo "⚠️  兌換碼無效或已使用"
    echo "💡 提示: 請確認數據庫中有此兌換碼"
else
    echo "❌ 兌換失敗"
fi

echo ""

# 測試 7: 查詢我的課程
echo "測試 7: 查詢我的課程"
echo "--------------------------------"

MY_COURSES_RESPONSE=$(curl -s -X GET "$API_URL/api/auth/my-courses" \
  -H "Authorization: Bearer $SESSION_TOKEN")

echo "Response: $MY_COURSES_RESPONSE"

if echo "$MY_COURSES_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 查詢成功"
    
    # 檢查是否有課程
    if echo "$MY_COURSES_RESPONSE" | grep -q "hasFullAccess.*true"; then
        echo "🎓 用戶擁有完整課程訪問權限"
    else
        echo "📚 用戶課程列表已返回"
    fi
else
    echo "❌ 查詢失敗"
fi

echo ""

# 測試 8: 檢查課程訪問權限
echo "測試 8: 檢查課程訪問權限"
echo "--------------------------------"

TEST_LESSON="B1"
echo "測試課程: $TEST_LESSON"

CHECK_LESSON_RESPONSE=$(curl -s -X POST "$API_URL/api/check-lesson" \
  -H "Content-Type: application/json" \
  -d "{
    \"lessonId\": \"$TEST_LESSON\",
    \"sessionToken\": \"$SESSION_TOKEN\"
  }")

echo "Response: $CHECK_LESSON_RESPONSE"

if echo "$CHECK_LESSON_RESPONSE" | grep -q "canAccess.*true"; then
    echo "✅ 可以訪問課程 $TEST_LESSON"
else
    echo "❌ 無法訪問課程 $TEST_LESSON"
fi

echo ""
echo "================================"
echo "🎉 測試完成！"
echo ""
echo "📝 測試摘要:"
echo "- Email: $TEST_EMAIL"
echo "- Session Token: ${SESSION_TOKEN:0:30}..."
echo "- Device ID: $DEVICE_ID"
echo ""
echo "💡 提示:"
echo "1. 如果兌換碼測試失敗，請確認數據庫中有測試兌換碼"
echo "2. 生產環境不會返回驗證碼，需要檢查 Email"
echo "3. 可以在 Cloudflare Dashboard 查看日誌"
echo ""
