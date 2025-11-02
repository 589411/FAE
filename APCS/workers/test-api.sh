#!/bin/bash

# 🧪 APCS API 測試腳本
# 用於驗證 Cloudflare Workers API 的所有功能

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 APCS API 功能測試"
echo "===================="
echo ""

# 獲取 Worker URL
if [ -z "$1" ]; then
    read -p "請輸入 Worker URL: " WORKER_URL
else
    WORKER_URL=$1
fi

echo -e "${BLUE}測試目標: ${WORKER_URL}${NC}"
echo ""

# 測試計數器
PASSED=0
FAILED=0

# 測試函數
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -e "${YELLOW}測試: ${test_name}${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "${WORKER_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "${WORKER_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # 分離響應體和狀態碼
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # 檢查狀態碼
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ 狀態碼正確: ${http_code}${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ 狀態碼錯誤: 期望 ${expected_status}, 實際 ${http_code}${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # 顯示響應
    echo "響應:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    
    # 返回響應體供後續使用
    echo "$body"
}

# 開始測試
echo "=================================="
echo ""

# 測試 1: 健康檢查
echo -e "${BLUE}[1/8] 健康檢查${NC}"
test_api "健康檢查" "GET" "/api/health" "" 200
echo "---"
echo ""

# 測試 2: 驗證有效兌換碼
echo -e "${BLUE}[2/8] 驗證有效兌換碼${NC}"
response=$(test_api "驗證 APCS2024-DEMO02" "POST" "/api/validate-code" '{"code":"APCS2024-DEMO02"}' 200)

# 提取 token
TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ 成功獲取 Token${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ 未能獲取 Token${NC}"
fi
echo "---"
echo ""

# 測試 3: 驗證 Token
if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}[3/8] 驗證 Token${NC}"
    test_api "驗證 Token" "POST" "/api/verify-token" "{\"token\":\"$TOKEN\"}" 200
else
    echo -e "${YELLOW}⚠️  跳過 Token 驗證測試（無 Token）${NC}"
fi
echo "---"
echo ""

# 測試 4: 重複使用兌換碼（應該失敗）
echo -e "${BLUE}[4/8] 重複使用兌換碼${NC}"
test_api "重複使用 APCS2024-DEMO02" "POST" "/api/validate-code" '{"code":"APCS2024-DEMO02"}' 200
echo "---"
echo ""

# 測試 5: 無效兌換碼
echo -e "${BLUE}[5/8] 無效兌換碼${NC}"
test_api "驗證無效碼" "POST" "/api/validate-code" '{"code":"INVALID-CODE-12345"}' 200
echo "---"
echo ""

# 測試 6: 空兌換碼
echo -e "${BLUE}[6/8] 空兌換碼${NC}"
test_api "空兌換碼" "POST" "/api/validate-code" '{"code":""}' 400
echo "---"
echo ""

# 測試 7: 無效 Token
echo -e "${BLUE}[7/8] 無效 Token${NC}"
test_api "驗證無效 Token" "POST" "/api/verify-token" '{"token":"invalid.token.here"}' 200
echo "---"
echo ""

# 測試 8: 驗證新的兌換碼
echo -e "${BLUE}[8/8] 驗證另一個兌換碼${NC}"
test_api "驗證 APCS2024-DEMO03" "POST" "/api/validate-code" '{"code":"APCS2024-DEMO03"}' 200
echo "---"
echo ""

# 測試總結
echo "=================================="
echo -e "${BLUE}測試總結${NC}"
echo "=================================="
echo -e "通過: ${GREEN}${PASSED}${NC}"
echo -e "失敗: ${RED}${FAILED}${NC}"
echo -e "總計: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有測試通過！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 ${FAILED} 個測試失敗${NC}"
    exit 1
fi
