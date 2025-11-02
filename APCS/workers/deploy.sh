#!/bin/bash

# 🚀 APCS 方案 B 自動部署腳本
# 此腳本將引導你完成 Cloudflare Workers + D1 的部署

set -e  # 遇到錯誤立即退出

echo "🚀 APCS 課程系統 - 方案 B 部署腳本"
echo "=================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查 Node.js
echo "📦 檢查環境..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未安裝 Node.js${NC}"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 已安裝: $(node --version)${NC}"

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 未安裝 npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm 已安裝: $(npm --version)${NC}"

# 安裝 Wrangler
echo ""
echo "📦 檢查 Wrangler CLI..."
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  未安裝 Wrangler，正在安裝...${NC}"
    npm install -g wrangler
    echo -e "${GREEN}✅ Wrangler 安裝完成${NC}"
else
    echo -e "${GREEN}✅ Wrangler 已安裝: $(wrangler --version)${NC}"
fi

# 登入 Cloudflare
echo ""
echo "🔐 登入 Cloudflare..."
echo "即將打開瀏覽器進行授權..."
read -p "按 Enter 繼續..."
wrangler login

# 創建 D1 數據庫
echo ""
echo "🗄️  創建 D1 數據庫..."
read -p "是否創建新的 D1 數據庫？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在創建數據庫 'apcs-course-db'..."
    wrangler d1 create apcs-course-db
    
    echo ""
    echo -e "${YELLOW}⚠️  重要：請複製上面的 database_id${NC}"
    echo "稍後需要填入 wrangler.toml"
    read -p "按 Enter 繼續..."
fi

# 創建 KV 命名空間
echo ""
echo "🔑 創建 KV 命名空間..."
read -p "是否創建新的 KV 命名空間？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在創建 KV 命名空間 'COURSE_ACCESS'..."
    wrangler kv:namespace create "COURSE_ACCESS"
    
    echo ""
    echo -e "${YELLOW}⚠️  重要：請複製上面的 KV namespace id${NC}"
    echo "稍後需要填入 wrangler.toml"
    read -p "按 Enter 繼續..."
fi

# 配置 wrangler.toml
echo ""
echo "⚙️  配置 wrangler.toml..."
if [ ! -f "wrangler.toml" ]; then
    echo "創建 wrangler.toml 模板..."
    cat > wrangler.toml << 'EOF'
name = "apcs-auth-api"
main = "auth-api.js"
compatibility_date = "2024-01-01"

# D1 數據庫綁定
[[d1_databases]]
binding = "DB"
database_name = "apcs-course-db"
database_id = "YOUR_DATABASE_ID_HERE"

# KV 綁定
[[kv_namespaces]]
binding = "COURSE_ACCESS"
id = "YOUR_KV_NAMESPACE_ID_HERE"

# 環境變數
[vars]
ALLOWED_ORIGINS = "http://localhost:8000,https://apcs-space.pages.dev"
EOF
    echo -e "${YELLOW}⚠️  請編輯 wrangler.toml，填入 database_id 和 KV id${NC}"
    echo "文件位置: $(pwd)/wrangler.toml"
    read -p "完成後按 Enter 繼續..."
else
    echo -e "${GREEN}✅ wrangler.toml 已存在${NC}"
fi

# 初始化數據庫
echo ""
echo "📊 初始化數據庫..."
read -p "是否執行 schema.sql？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "schema.sql" ]; then
        wrangler d1 execute apcs-course-db --file=schema.sql
        echo -e "${GREEN}✅ 數據庫初始化完成${NC}"
        
        # 驗證
        echo ""
        echo "驗證數據庫..."
        wrangler d1 execute apcs-course-db --command="SELECT COUNT(*) as count FROM redemption_codes"
    else
        echo -e "${RED}❌ 找不到 schema.sql${NC}"
    fi
fi

# 設置 JWT 密鑰
echo ""
echo "🔐 設置 JWT 密鑰..."
read -p "是否設置 JWT_SECRET？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "請輸入一個強密碼作為 JWT 密鑰："
    echo "（建議至少 32 個字符，包含字母、數字和符號）"
    wrangler secret put JWT_SECRET
fi

# 部署 Worker
echo ""
echo "🚀 部署 Worker..."
read -p "是否立即部署？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler deploy
    echo ""
    echo -e "${GREEN}✅ Worker 部署完成！${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  重要：請複製上面的 Worker URL${NC}"
    echo "需要更新到前端的 api-client.js"
fi

# 測試 API
echo ""
echo "🧪 測試 API..."
read -p "是否測試 API？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "請輸入 Worker URL: " WORKER_URL
    
    echo ""
    echo "測試健康檢查..."
    curl -s "${WORKER_URL}/api/health" | python3 -m json.tool
    
    echo ""
    echo "測試兌換碼驗證..."
    curl -s -X POST "${WORKER_URL}/api/validate-code" \
        -H "Content-Type: application/json" \
        -d '{"code":"APCS2024-DEMO01"}' | python3 -m json.tool
fi

# 完成
echo ""
echo "=================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "下一步："
echo "1. 更新前端 API 端點（web/scripts/api-client.js）"
echo "2. 推送代碼到 GitHub"
echo "3. 在 Cloudflare Pages 部署前端"
echo "4. 測試完整流程"
echo ""
echo "詳細步驟請參考：方案B部署檢查清單.md"
echo ""
