#!/bin/bash

# 測試設備綁定系統

echo "🧪 測試設備綁定系統"
echo "===================="
echo ""

API_URL="https://apcs-auth-api.589411.workers.dev"

# 測試 1: 使用設備 1 兌換碼
echo "📱 測試 1: 設備 1 兌換碼"
echo "------------------------"
RESPONSE1=$(curl -s -X POST "${API_URL}/api/validate-code" \
  -H "Content-Type: application/json" \
  -d '{"code":"APCS2024-TEST02","deviceId":"dev_test_device1"}')

echo "$RESPONSE1" | python3 -m json.tool
echo ""

# 提取 token 和 tokenId
TOKEN=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
TOKEN_ID=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('tokenId', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ 兌換失敗，停止測試"
    exit 1
fi

echo "✅ 獲得 Token"
echo "TokenId: $TOKEN_ID"
echo ""

# 測試 2: 設備 1 訪問課程
echo "📱 測試 2: 設備 1 訪問課程 B1"
echo "------------------------"
curl -s -X POST "${API_URL}/api/check-lesson" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"tokenId\":\"$TOKEN_ID\",\"deviceId\":\"dev_test_device1\",\"lessonId\":\"B1\"}" | python3 -m json.tool
echo ""

# 測試 3: 設備 2 使用相同 Token（應該成功，因為未達上限）
echo "📱 測試 3: 設備 2 使用相同 Token"
echo "------------------------"
curl -s -X POST "${API_URL}/api/check-lesson" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"tokenId\":\"$TOKEN_ID\",\"deviceId\":\"dev_test_device2\",\"lessonId\":\"B1\"}" | python3 -m json.tool
echo ""

# 測試 4: 設備 3 使用相同 Token
echo "📱 測試 4: 設備 3 使用相同 Token"
echo "------------------------"
curl -s -X POST "${API_URL}/api/check-lesson" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"tokenId\":\"$TOKEN_ID\",\"deviceId\":\"dev_test_device3\",\"lessonId\":\"B1\"}" | python3 -m json.tool
echo ""

# 測試 5: 設備 4 使用相同 Token（應該失敗，達到上限）
echo "📱 測試 5: 設備 4 使用相同 Token（應該失敗）"
echo "------------------------"
curl -s -X POST "${API_URL}/api/check-lesson" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"tokenId\":\"$TOKEN_ID\",\"deviceId\":\"dev_test_device4\",\"lessonId\":\"B1\"}" | python3 -m json.tool
echo ""

# 測試 6: 解碼 Token 檢查內容
echo "🔍 測試 6: 解碼 Token 檢查內容"
echo "------------------------"
TOKEN_PART1=$(echo "$TOKEN" | cut -d'.' -f1)
echo "Token 第一部分（Base64）: $TOKEN_PART1"
echo ""
echo "解碼後的內容:"
echo "$TOKEN_PART1" | base64 -d 2>/dev/null | python3 -m json.tool
echo ""

echo "✅ 測試完成！"
echo ""
echo "📊 預期結果:"
echo "  - 測試 1: 兌換成功"
echo "  - 測試 2: 設備 1 可訪問"
echo "  - 測試 3: 設備 2 可訪問（自動添加）"
echo "  - 測試 4: 設備 3 可訪問（自動添加）"
echo "  - 測試 5: 設備 4 被拒絕（達到上限 3 台）"
echo "  - 測試 6: Token 中看不到兌換碼，只有 tokenId"
