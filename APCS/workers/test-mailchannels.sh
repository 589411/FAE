#!/bin/bash

# 直接測試 MailChannels API

echo "🧪 測試 MailChannels API..."
echo ""

curl -X POST https://api.mailchannels.net/tx/v1/send \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [
      {
        "to": [{"email": "test@example.com", "name": "測試"}],
        "dkim_domain": "apcs.launchdock.app",
        "dkim_selector": "mailchannels"
      }
    ],
    "from": {
      "email": "noreply@apcs.launchdock.app",
      "name": "APCS 測試"
    },
    "subject": "測試郵件",
    "content": [
      {
        "type": "text/plain",
        "value": "這是一封測試郵件"
      }
    ]
  }' -v

echo ""
echo "完成"
