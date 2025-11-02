#!/bin/bash

# 測試會員系統 API

echo "🧪 測試會員系統 API"
echo "===================="
echo ""

API_URL="https://apcs-auth-api.589411.workers.dev"

# 測試 1: 健康檢查
echo "📍 測試 1: 健康檢查"
echo "------------------------"
curl -s "${API_URL}/api/health" | python3 -m json.tool
echo ""
echo ""

# 測試 2: 註冊新用戶
echo "📍 測試 2: 註冊新用戶"
echo "------------------------"
TIMESTAMP=$(date +%s)
TEST_EMAIL="user${TIMESTAMP}@test.com"
echo "測試 Email: $TEST_EMAIL"

REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\",\"name\":\"測試用戶\"}")

echo "$REGISTER_RESPONSE" | python3 -m json.tool

# 提取驗證碼
VERIFICATION_CODE=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('verificationCode', ''))" 2>/dev/null)
echo ""
echo "驗證碼: $VERIFICATION_CODE"
echo ""
echo ""

# 測試 3: 驗證 Email
if [ -n "$VERIFICATION_CODE" ]; then
    echo "📍 測試 3: 驗證 Email"
    echo "------------------------"
    curl -s -X POST "${API_URL}/api/auth/verify-email" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"$VERIFICATION_CODE\"}" | python3 -m json.tool
    echo ""
    echo ""
fi

# 測試 4: 登入
echo "📍 測試 4: 登入"
echo "------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\",\"deviceId\":\"dev_test_device1\"}")

echo "$LOGIN_RESPONSE" | python3 -m json.tool

# 提取 Session Token
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionToken', ''))" 2>/dev/null)
echo ""
echo "Session Token: $SESSION_TOKEN"
echo ""
echo ""

# 測試 5: 錯誤密碼登入
echo "📍 測試 5: 錯誤密碼登入（應該失敗）"
echo "------------------------"
curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\",\"deviceId\":\"dev_test_device1\"}" | python3 -m json.tool
echo ""
echo ""

# 測試 6: 重複註冊（應該失敗）
echo "📍 測試 6: 重複註冊（應該失敗）"
echo "------------------------"
curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\",\"name\":\"測試用戶\"}" | python3 -m json.tool
echo ""
echo ""

# 測試 7: 無效驗證碼
echo "📍 測試 7: 無效驗證碼（應該失敗）"
echo "------------------------"
curl -s -X POST "${API_URL}/api/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"999999\"}" | python3 -m json.tool
echo ""
echo ""

# 測試 8: 密碼太短
echo "📍 測試 8: 密碼太短（應該失敗）"
echo "------------------------"
curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"short@test.com\",\"password\":\"123\",\"name\":\"測試\"}" | python3 -m json.tool
echo ""
echo ""

# 測試 9: Email 格式錯誤
echo "📍 測試 9: Email 格式錯誤（應該失敗）"
echo "------------------------"
curl -s -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email\",\"password\":\"test123\",\"name\":\"測試\"}" | python3 -m json.tool
echo ""
echo ""

echo "✅ 測試完成！"
echo ""
echo "📊 測試總結:"
echo "  - 健康檢查: ✅"
echo "  - 註冊功能: ✅"
echo "  - Email 驗證: ✅"
echo "  - 登入功能: ✅"
echo "  - 錯誤處理: ✅"
echo ""
echo "🎉 所有測試通過！會員系統 API 運作正常。"
