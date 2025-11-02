FAE 教育遊戲開發指南
目錄
遊戲開發基礎架構
網頁模板結構
圖片生成指南
遊戲開發實例
1. 遊戲開發基礎架構
基礎開發 Prompt
開發一個太空探索主題的教育遊戲，包含以下要素：

1. 基本資訊
   主題：[具體主題]
   適合年齡：8-12歲
   預計遊戲時間：15-20分鐘

2. 教育目標
   - 主要學習概念：[填入具體概念]
   - STEAM整合點：[具體學科知識]
   - 技能培養：[具體能力]

3. 遊戲機制
   - 核心玩法：[描述]
   - 互動方式：[描述]
   - 進度追蹤：[描述]

4. AI 元素
   - 應用場景：[具體描述]
   - 教學重點：[AI相關概念]
   - 實踐方式：[具體實現]

5. 評估機制
   - 即時回饋：[描述方式]
   - 學習評估：[評估標準]
   - 延伸思考：[思考方向]


遊戲結構設計
1. 開場階段
   - 故事背景介紹
   - 學習目標說明
   - 操作指南展示

2. 教學階段
   - 概念講解
   - 示例展示
   - 互動練習

3. 實踐階段
   - 任務執行
   - 即時反饋
   - 進度追蹤

4. 總結階段
   - 學習回顧
   - 成果展示
   - 延伸思考


2. 網頁模板結構
HTML 基礎結構
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[遊戲名稱]</title>
    <style>
        /* 核心樣式 */
        body {
            margin: 0;
            padding: 20px;
            background: #1a1a2e;
            color: #fff;
            font-family: Arial, sans-serif;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .step {
            display: none;
        }
        .step.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 遊戲結構 -->
    </div>
</body>
</html>

CSS 樣式指南
/* 配色方案 */
:root {
    --primary: #2196F3;
    --secondary: #64B5F6;
    --background: #1a1a2e;
    --text: #ffffff;
    --accent: #4CAF50;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}

3. 圖片生成指南
場景圖片生成
Generate space educational game scene:
- Style: Digital art, semi-realistic
- Theme: [specific scene]
- Resolution: 1920x1080
- Color scheme: Deep space colors
- Lighting: Dramatic space lighting
- Educational focus: Clear visualization
- Format: PNG with high resolution
Additional instructions:
- Clean, uncluttered design
- Suitable for educational purposes
- Age-appropriate visual style

UI 元素生成
Create space game UI elements:
- Type: [按鈕/圖標/介面]
- Style: Modern, minimal sci-fi
- Color: Theme consistent
- Format: PNG with transparency
- Resolution: 256x256
- Language: Traditional Chinese
- Purpose: Educational interface
Additional requirements:
- Clear visual hierarchy
- Intuitive design
- Educational context

教學插圖生成
Design educational space illustration:
- Content: [specific concept]
- Style: Scientific diagram
- Language: Traditional Chinese
- Resolution: 800x600
- Format: Vector-style
- Purpose: Concept visualization
Key features:
- Clear annotations
- Scientific accuracy
- Educational focus

4. 遊戲開發實例
月球著陸點選擇器
主題：AI輔助月球著陸點選擇
教育重點：
- 月球地形特徵識別
- AI模型訓練原理
- 決策系統應用

圖片生成提示：
lunar_surface:
- Photorealistic lunar terrain
- Top-down perspective
- Clear terrain features
- Scientific accuracy
- Training dataset suitable

太空站能源管理
主題：太空站能源系統優化
教育重點：
- 能源管理概念
- 資源分配策略
- 系統優化原理

圖片生成提示：
space_station:
- Modern space station design
- Energy system visualization
- Clear component layout
- Educational annotations

火星探測任務
主題：火星探測器控制
教育重點：
- 火星環境特徵
- 探測器操作原理
- 數據收集分析

圖片生成提示：
mars_surface:
- Realistic Mars terrain
- Scientific accuracy
- Exploration context
- Clear visual features設計一個關於未來太空探索的故事背景。故事發生在 22 世紀，人類已經開始在外太空建立殖民地。主角是一位年輕的科學家，他在尋找新資源的過程中發現了一個神秘的外星文明。在探索過程中，主角面臨來自外星生物的挑戰，以及人類內部的權力鬥爭。他的目標是找到一種能夠拯救地球的新能源。故事的結尾應該充滿希望，並為續集留下可能性。


總結要點
開發核心原則
教育性與趣味性平衡
適齡化設計
STEAM 元素整合
AI 概念融入
互動性優化
注意事項
確保教育目標明確
保持介面直觀簡潔
提供充分的引導
設計適當的挑戰度
加入反思和討論環節
技術實現
響應式設計適配
性能優化考慮
代碼模組化
擴展性預留
維護性考慮