#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
APCS 課程頁面生成器
根據 Markdown 內容自動生成 HTML 課程頁面
"""

import os
import re
from pathlib import Path

# 課程配置
LESSONS = [
    {
        "level": "L1",
        "level_name": "月球基地訓練",
        "icon": "🌙",
        "units": [
            {"id": "A1", "md": "A1-通訊系統與高速IO.md", "title": "通訊系統與高速 I/O"},
            {"id": "A2", "md": "A2-導航邏輯與條件判斷.md", "title": "導航邏輯與條件判斷"},
            {"id": "A3", "md": "A3-數據陣列與感測器管理.md", "title": "數據陣列與感測器管理"},
        ]
    },
    {
        "level": "L2",
        "level_name": "木星軌道站",
        "icon": "🪐",
        "units": [
            {"id": "B1", "md": "B1-加密通訊與字串處理.md", "title": "加密通訊與字串處理"},
            {"id": "B2", "md": "B2-土星環模擬與二維陣列.md", "title": "土星環模擬與二維陣列"},
        ]
    },
    {
        "level": "L3",
        "level_name": "天王星高速電梯",
        "icon": "🚀",
        "units": [
            {"id": "C1", "md": "C1-堆疊與佇列系統.md", "title": "堆疊與佇列系統"},
            {"id": "C2", "md": "C2-遞迴與回溯探索.md", "title": "遞迴與回溯探索"},
        ]
    },
    {
        "level": "L4",
        "level_name": "冥王星邊界",
        "icon": "🌌",
        "units": [
            {"id": "D1", "md": "D1-星際網絡與圖論.md", "title": "星際網絡與圖論"},
        ]
    },
    {
        "level": "L5",
        "level_name": "終極挑戰",
        "icon": "⭐",
        "units": [
            {"id": "E1", "md": "E1-動態規劃與優化.md", "title": "動態規劃與優化"},
        ]
    },
]

# 路徑配置
BASE_DIR = Path(__file__).parent
COURSE_DIR = BASE_DIR.parent / "太空探險課程"
LESSONS_DIR = BASE_DIR / "lessons"

def read_markdown(md_path):
    """讀取 Markdown 文件"""
    with open(md_path, 'r', encoding='utf-8') as f:
        return f.read()

def extract_sections(md_content):
    """從 Markdown 中提取各個章節"""
    sections = {}
    
    # 提取任務背景
    mission_match = re.search(r'## 🚀 任務背景\n\n(.*?)(?=\n##)', md_content, re.DOTALL)
    if mission_match:
        sections['mission'] = mission_match.group(1).strip()
    
    # 提取知識點說明
    knowledge_match = re.search(r'## 📚 知識點說明\n\n(.*?)(?=\n## 💻)', md_content, re.DOTALL)
    if knowledge_match:
        sections['knowledge'] = knowledge_match.group(1).strip()
    
    # 提取範例程式碼
    examples_match = re.search(r'## 💻 範例程式碼\n\n(.*?)(?=\n## 🔍)', md_content, re.DOTALL)
    if examples_match:
        sections['examples'] = examples_match.group(1).strip()
    
    # 提取程式碼解說
    explanation_match = re.search(r'## 🔍 程式碼解說\n\n(.*?)(?=\n## 📝)', md_content, re.DOTALL)
    if explanation_match:
        sections['explanation'] = explanation_match.group(1).strip()
    
    # 提取 Quiz
    quiz_match = re.search(r'## 📝 Quiz[：:](.*?)\n\n(.*?)(?=\n## ✅)', md_content, re.DOTALL)
    if quiz_match:
        sections['quiz_title'] = quiz_match.group(1).strip()
        sections['quiz'] = quiz_match.group(2).strip()
    
    # 提取解答
    solution_match = re.search(r'## ✅ Quiz 解答\n\n(.*?)(?=\n## 🎯)', md_content, re.DOTALL)
    if solution_match:
        sections['solution'] = solution_match.group(1).strip()
    
    # 提取 APCS 對應
    apcs_match = re.search(r'## 🔗 APCS 對應能力\n(.*?)$', md_content, re.DOTALL)
    if apcs_match:
        sections['apcs'] = apcs_match.group(1).strip()
    
    return sections

def add_code_highlights(code):
    """為程式碼添加重點標記"""
    lines = code.split('\n')
    processed = []
    
    for line in lines:
        # 自動檢測關鍵行並添加標記
        if 'import sys' in line and '# 🔑' not in line:
            line = line.replace('import sys', 'import sys  # 🔑 匯入系統模組')
        elif 'sys.stdin.readline' in line and '# ⚡' not in line and '# 🔑' not in line:
            if '# ' not in line:
                line = line + '  # ⚡ 高速 I/O'
        elif line.strip().startswith('def ') and '# ⚡' not in line:
            if '# ' not in line:
                line = line + '  # ⚡ 函式定義'
        
        processed.append(line)
    
    return '\n'.join(processed)

def generate_html(level_info, unit_info, prev_unit, next_unit):
    """生成單個課程的 HTML"""
    
    # 讀取 Markdown
    md_path = COURSE_DIR / f"{level_info['level']}-{level_info['level_name']}" / unit_info['md']
    if not md_path.exists():
        print(f"⚠️ 找不到文件：{md_path}")
        return None
    
    md_content = read_markdown(md_path)
    sections = extract_sections(md_content)
    
    # 提取完整標題
    title_match = re.search(r'# (.*?)\n', md_content)
    full_title = title_match.group(1) if title_match else unit_info['title']
    
    # 生成 HTML（這裡簡化處理，實際應該使用完整的模板）
    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{unit_info['id']}: {unit_info['title']} | APCS 太空探險課程</title>
    <link rel="stylesheet" href="../../styles/main.css">
    <link rel="stylesheet" href="../../styles/lesson.css">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
</head>
<body>
    <canvas id="starfield" class="starfield"></canvas>
    
    <nav class="lesson-nav glass">
        <div class="nav-content">
            <a href="../../index.html" class="back-btn">
                <span>←</span>
                <span>返回課程地圖</span>
            </a>
            <div class="lesson-progress">
                <span class="progress-text">{level_info['level']} - {unit_info['id']}</span>
            </div>
            <div class="lesson-nav-buttons">
                <a href="{prev_unit}.html" class="nav-btn prev-btn" {'style="opacity: 0.5; pointer-events: none;"' if not prev_unit else ''}>上一課</a>
                <a href="{next_unit}.html" class="nav-btn next-btn" {'style="opacity: 0.5; pointer-events: none;"' if not next_unit else ''}>下一課</a>
            </div>
        </div>
    </nav>

    <main class="lesson-container">
        <aside class="lesson-sidebar glass">
            <h3 class="sidebar-title">📋 本課內容</h3>
            <nav class="sidebar-nav">
                <a href="#mission" class="sidebar-link active">🚀 任務背景</a>
                <a href="#knowledge" class="sidebar-link">📚 知識點說明</a>
                <a href="#examples" class="sidebar-link">💻 範例程式碼</a>
                <a href="#explanation" class="sidebar-link">🔍 程式碼解說</a>
                <a href="#quiz" class="sidebar-link">📝 Quiz</a>
                <a href="#solution" class="sidebar-link">✅ 解答</a>
            </nav>
        </aside>

        <article class="lesson-content">
            <header class="lesson-header">
                <div class="lesson-badge">
                    <span class="badge-icon">{level_info['icon']}</span>
                    <span class="badge-text">{level_info['level']}: {level_info['level_name']}</span>
                </div>
                <h1 class="lesson-title text-glow">{full_title}</h1>
                <div class="lesson-meta">
                    <span class="meta-item">⏱️ 預計時間：2-3 小時</span>
                    <span class="meta-item">🎯 目標級分：1-2 級分</span>
                    <span class="meta-item">📊 難度：⭐⭐☆☆☆</span>
                </div>
            </header>

            <!-- 任務背景 -->
            <section id="mission" class="content-section">
                <h2 class="section-heading">
                    <span class="heading-icon">🚀</span>
                    <span>任務背景</span>
                </h2>
                <div class="content-box glass">
                    {convert_markdown_to_html(sections.get('mission', ''))}
                </div>
            </section>

            <!-- 其他章節省略，實際生成時需要完整實現 -->
            
            <div class="lesson-navigation">
                <a href="{prev_unit}.html" class="nav-btn prev-btn" {'style="opacity: 0.5; pointer-events: none;"' if not prev_unit else ''}>← 上一課</a>
                <a href="../../index.html" class="nav-btn home-btn">🏠 課程地圖</a>
                <a href="{next_unit}.html" class="nav-btn next-btn" {'style="opacity: 0.5; pointer-events: none;"' if not next_unit else ''}>下一課 →</a>
            </div>
        </article>
    </main>

    <script src="../../scripts/starfield.js"></script>
    <script src="../../scripts/lesson.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
</body>
</html>"""
    
    return html

def convert_markdown_to_html(md_text):
    """簡單的 Markdown 轉 HTML（實際應使用完整的 Markdown 解析器）"""
    # 這裡只是示例，實際需要更完整的轉換
    html = md_text
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)
    html = html.replace('\n\n', '</p><p>')
    html = f'<p>{html}</p>'
    return html

def main():
    """主函數"""
    print("🚀 開始生成 APCS 課程頁面...")
    
    all_units = []
    for level in LESSONS:
        for unit in level['units']:
            all_units.append({
                'level': level,
                'unit': unit,
                'file': f"{level['level']}/{unit['id']}.html"
            })
    
    # 生成每個課程頁面
    for i, item in enumerate(all_units):
        prev_unit = all_units[i-1]['unit']['id'] if i > 0 else None
        next_unit = all_units[i+1]['unit']['id'] if i < len(all_units) - 1 else None
        
        print(f"📝 生成 {item['level']['level']}-{item['unit']['id']}: {item['unit']['title']}")
        
        html = generate_html(item['level'], item['unit'], prev_unit, next_unit)
        
        if html:
            output_dir = LESSONS_DIR / item['level']['level']
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / f"{item['unit']['id']}.html"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html)
            
            print(f"✅ 已生成：{output_file}")
    
    print("\n🎉 所有課程頁面生成完成！")

if __name__ == "__main__":
    main()
