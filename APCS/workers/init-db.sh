#!/bin/bash

# 初始化 Cloudflare D1 數據庫腳本

echo "🗄️  初始化 APCS D1 數據庫..."
echo ""

# 檢查是否已登入 Cloudflare
echo "檢查 Cloudflare 登入狀態..."
wrangler whoami

if [ $? -ne 0 ]; then
    echo "❌ 請先登入 Cloudflare:"
    echo "   wrangler login"
    exit 1
fi

echo ""
echo "📋 執行數據庫 Schema..."

# 執行 SQL 腳本
wrangler d1 execute apcs-course-db --file=schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 數據庫初始化成功！"
    echo ""
    echo "📊 驗證數據..."
    
    # 查詢兌換碼數量
    wrangler d1 execute apcs-course-db --command="SELECT COUNT(*) as total FROM redemption_codes;"
    
    echo ""
    echo "🎉 完成！數據庫已準備就緒。"
else
    echo ""
    echo "❌ 數據庫初始化失敗"
    exit 1
fi
