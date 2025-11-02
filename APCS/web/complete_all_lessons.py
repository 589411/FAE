#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整課程生成器 - 生成所有 APCS 課程 HTML 頁面
"""

import os
import re
from pathlib import Path

# 完整課程配置（根據課程規劃）
LESSONS_CONFIG = [
    {
        "level": "L1",
        "level_name": "月球基地訓練",
        "icon": "🌙",
        "target_score": "1-2 級分",
        "difficulty": "⭐⭐☆☆☆",
        "units": [
            {"id": "A1", "md": "A1-通訊系統與高速IO.md", "title": "通訊系統與高速 I/O", "time": "2-3 小時"},
            {"id": "A2", "md": "A2-導航邏輯與條件判斷.md", "title": "導航邏輯與條件判斷", "time": "3-4 小時"},
            {"id": "A3", "md": "A3-數據陣列與感測器管理.md", "title": "數據陣列與感測器管理", "time": "3-4 小時"},
        ]
    },
    {
        "level": "L2",
        "level_name": "木星軌道站",
        "icon": "🪐",
        "target_score": "3 級分",
        "difficulty": "⭐⭐⭐☆☆",
        "units": [
            {"id": "B1", "md": "B1-加密通訊與字串處理.md", "title": "加密通訊與字串處理", "time": "3-4 小時"},
            {"id": "B2", "md": "B2-土星環模擬與二維陣列.md", "title": "土星環模擬與二維陣列", "time": "4-5 小時"},
            {"id": "B3", "md": "B3-函式與模組化工程.md", "title": "函式與模組化工程", "time": "4-5 小時"},
        ]
    },
    {
        "level": "L3",
        "level_name": "天王星高速電梯",
        "icon": "🚀",
        "target_score": "4 級分",
        "difficulty": "⭐⭐⭐⭐☆",
        "units": [
            {"id": "C1", "md": "C1-堆疊與佇列系統.md", "title": "堆疊與佇列系統", "time": "4-5 小時"},
            {"id": "C2", "md": "C2-遞迴與回溯探索.md", "title": "遞迴與回溯探索", "time": "5-6 小時"},
            {"id": "C3", "md": "C3-排序與二分搜尋.md", "title": "排序與二分搜尋", "time": "4-5 小時"},
        ]
    },
    {
        "level": "L4",
        "level_name": "冥王星邊界",
        "icon": "🌌",
        "target_score": "5 級分",
        "difficulty": "⭐⭐⭐⭐⭐",
        "units": [
            {"id": "D1", "md": "D1-星際網絡與圖論.md", "title": "星際網絡與圖論", "time": "6-8 小時"},
            {"id": "D2", "md": "D2-動態規劃藝術.md", "title": "動態規劃藝術", "time": "6-8 小時"},
            {"id": "D3", "md": "D3-分治與貪心策略.md", "title": "分治與貪心策略", "time": "5-6 小時"},
        ]
    },
    {
        "level": "L5",
        "level_name": "終極挑戰",
        "icon": "⭐",
        "target_score": "5 級分",
        "difficulty": "⭐⭐⭐⭐⭐",
        "units": [
            {"id": "E1", "md": "E1-動態規劃與優化.md", "title": "綜合應用與優化", "time": "8-10 小時"},
        ]
    },
]

# 路徑配置
BASE_DIR = Path(__file__).parent
COURSE_DIR = BASE_DIR.parent / "太空探險課程"
LESSONS_DIR = BASE_DIR / "lessons"
TEMPLATE_FILE = LESSONS_DIR / "lesson-template.html"

def read_file(file_path):
    """讀取文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(file_path, content):
    """寫入文件"""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def extract_markdown_sections(md_content):
    """從 Markdown 中提取各個章節"""
    sections = {}
    
    # 提取標題
    title_match = re.search(r'^# (.+)$', md_content, re.MULTILINE)
    sections['title'] = title_match.group(1) if title_match else ""
    
    # 提取任務背景
    mission_match = re.search(r'## 🚀 任務背景\n\n(.*?)(?=\n##|\Z)', md_content, re.DOTALL)
    sections['mission'] = mission_match.group(1).strip() if mission_match else ""
    
    # 提取知識點說明
    knowledge_match = re.search(r'## 📚 知識點說明\n\n(.*?)(?=\n## 💻|\Z)', md_content, re.DOTALL)
    sections['knowledge'] = knowledge_match.group(1).strip() if knowledge_match else ""
    
    # 提取範例程式碼
    examples_match = re.search(r'## 💻 範例程式碼\n\n(.*?)(?=\n## 🔍|\Z)', md_content, re.DOTALL)
    sections['examples'] = examples_match.group(1).strip() if examples_match else ""
    
    # 提取程式碼解說
    explanation_match = re.search(r'## 🔍 程式碼解說\n\n(.*?)(?=\n## 📝|\Z)', md_content, re.DOTALL)
    sections['explanation'] = explanation_match.group(1).strip() if explanation_match else ""
    
    # 提取 Quiz
    quiz_match = re.search(r'## 📝 Quiz[：:]\s*(.+?)\n\n(.*?)(?=\n## ✅|\Z)', md_content, re.DOTALL)
    if quiz_match:
        sections['quiz_title'] = quiz_match.group(1).strip()
        sections['quiz'] = quiz_match.group(2).strip()
    else:
        sections['quiz_title'] = ""
        sections['quiz'] = ""
    
    # 提取解答
    solution_match = re.search(r'## ✅ Quiz 解答\n\n(.*?)(?=\n## 🎯|\n## 🔗|\Z)', md_content, re.DOTALL)
    sections['solution'] = solution_match.group(1).strip() if solution_match else ""
    
    return sections

def markdown_to_html(md_text):
    """將 Markdown 轉換為 HTML"""
    if not md_text:
        return ""
    
    html = md_text
    
    # 處理程式碼區塊
    def replace_code_block(match):
        lang = match.group(1) or 'python'
        code = match.group(2)
        return f'<pre><code class="language-{lang}">{code}</code></pre>'
    
    html = re.sub(r'```(\w+)?\n(.*?)```', replace_code_block, html, flags=re.DOTALL)
    
    # 處理行內程式碼
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    
    # 處理粗體
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    
    # 處理斜體
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    
    # 處理標題
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    
    # 處理列表
    lines = html.split('\n')
    in_list = False
    result = []
    for line in lines:
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            if not in_list:
                result.append('<ul>')
                in_list = True
            item = line.strip()[2:]
            result.append(f'<li>{item}</li>')
        elif line.strip().startswith(('1. ', '2. ', '3. ', '4. ', '5. ')):
            if not in_list:
                result.append('<ol>')
                in_list = True
            item = re.sub(r'^\d+\.\s+', '', line.strip())
            result.append(f'<li>{item}</li>')
        else:
            if in_list:
                if '<ul>' in result[-10:]:
                    result.append('</ul>')
                else:
                    result.append('</ol>')
                in_list = False
            result.append(line)
    
    if in_list:
        result.append('</ul>' if '- ' in html or '* ' in html else '</ol>')
    
    html = '\n'.join(result)
    
    # 處理段落
    paragraphs = html.split('\n\n')
    processed = []
    for p in paragraphs:
        p = p.strip()
        if p and not p.startswith('<') and not p.endswith('>'):
            processed.append(f'<p>{p}</p>')
        else:
            processed.append(p)
    
    return '\n'.join(processed)

def generate_lesson_html(level_info, unit_info, prev_link, next_link):
    """生成單個課程的 HTML"""
    
    # 讀取 Markdown
    md_path = COURSE_DIR / f"{level_info['level']}-{level_info['level_name']}" / unit_info['md']
    
    if not md_path.exists():
        print(f"⚠️  找不到 Markdown 文件：{md_path}")
        print(f"   將創建基礎框架...")
        return create_basic_framework(level_info, unit_info, prev_link, next_link)
    
    md_content = read_file(md_path)
    sections = extract_markdown_sections(md_content)
    
    # 生成完整 HTML
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
    <!-- 星空背景 -->
    <canvas id="starfield" class="starfield"></canvas>
    
    <!-- 導航欄 -->
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
                <a href="{prev_link}" class="nav-btn prev-btn" {'' if prev_link else 'style="opacity: 0.5; pointer-events: none;"'}>上一課</a>
                <a href="{next_link}" class="nav-btn next-btn" {'' if next_link else 'style="opacity: 0.5; pointer-events: none;"'}>下一課</a>
            </div>
        </div>
    </nav>

    <!-- 主要內容 -->
    <main class="lesson-container">
        <!-- 側邊欄目錄 -->
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

        <!-- 課程內容 -->
        <article class="lesson-content">
            <!-- 課程標題 -->
            <header class="lesson-header">
                <div class="lesson-badge">
                    <span class="badge-icon">{level_info['icon']}</span>
                    <span class="badge-text">{level_info['level']}: {level_info['level_name']}</span>
                </div>
                <h1 class="lesson-title text-glow">
                    {sections.get('title', unit_info['title'])}
                </h1>
                <div class="lesson-meta">
                    <span class="meta-item">⏱️ 預計時間：{unit_info.get('time', '3-4 小時')}</span>
                    <span class="meta-item">🎯 目標級分：{level_info.get('target_score', '1-2 級分')}</span>
                    <span class="meta-item">📊 難度：{level_info.get('difficulty', '⭐⭐⭐☆☆')}</span>
                </div>
            </header>

            <!-- 任務背景 -->
            <section id="mission" class="content-section">
                <h2 class="section-heading">
                    <span class="heading-icon">🚀</span>
                    <span>任務背景</span>
                </h2>
                <div class="content-box glass">
                    {markdown_to_html(sections.get('mission', ''))}
                </div>
            </section>

            <!-- 知識點說明 -->
            <section id="knowledge" class="content-section">
                <h2 class="section-heading">
                    <span class="heading-icon">📚</span>
                    <span>知識點說明</span>
                </h2>
                <div class="content-box glass">
                    {markdown_to_html(sections.get('knowledge', ''))}
                </div>
            </section>

            <!-- 範例程式碼 -->
            <section id="examples" class="content-section">
                <h2 class="section-heading">
                    <span class="heading-icon">💻</span>
                    <span>範例程式碼</span>
                </h2>
                <div class="content-box glass">
                    {markdown_to_html(sections.get('examples', ''))}
                </div>
            </section>

            <!-- 程式碼解說 -->
            <section id="explanation" class="content-section">
                <h2 class="section-heading">
                    <span class="heading-icon">🔍</span>
                    <span>程式碼解說</span>
                </h2>
                <div class="content-box glass">
                    {markdown_to_html(sections.get('explanation', ''))}
                </div>
            </section>

            <!-- Quiz -->
            <section id="quiz" class="content-section">
                <h2 class="section-heading">
                    <span class="heading-icon">📝</span>
                    <span>Quiz{': ' + sections.get('quiz_title', '') if sections.get('quiz_title') else ''}</span>
                </h2>
                <div class="quiz-box glass">
                    {markdown_to_html(sections.get('quiz', ''))}
                    <button class="show-solution-btn" onclick="toggleSolution()">
                        💡 查看解答
                    </button>
                </div>
            </section>

            <!-- 解答 -->
            <section id="solution" class="content-section solution-hidden">
                <h2 class="section-heading">
                    <span class="heading-icon">✅</span>
                    <span>Quiz 解答</span>
                </h2>
                <div class="solution-box glass">
                    {markdown_to_html(sections.get('solution', ''))}
                </div>
            </section>

            <!-- 完成徽章 -->
            <div class="completion-badge glass">
                <div class="badge-content">
                    <span class="badge-icon">🎉</span>
                    <h3>訓練完成！</h3>
                    <p>恭喜你完成 {unit_info['title']} 訓練！</p>
                </div>
            </div>

            <!-- 導航按鈕 -->
            <div class="lesson-navigation">
                <a href="{prev_link}" class="nav-btn prev-btn" {'' if prev_link else 'style="opacity: 0.5; pointer-events: none;"'}>← 上一課</a>
                <a href="../../index.html" class="nav-btn home-btn">🏠 課程地圖</a>
                <a href="{next_link}" class="nav-btn next-btn" {'' if next_link else 'style="opacity: 0.5; pointer-events: none;"'}>下一課 →</a>
            </div>
        </article>
    </main>

    <!-- JavaScript -->
    <script src="../../scripts/starfield.js"></script>
    <script src="../../scripts/lesson.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
</body>
</html>"""
    
    return html

def create_basic_framework(level_info, unit_info, prev_link, next_link):
    """創建基礎框架（當 Markdown 不存在時）"""
    # 創建空的 sections
    sections = {
        'title': unit_info['title'],
        'mission': '課程內容開發中...',
        'knowledge': '',
        'examples': '',
        'explanation': '',
        'quiz_title': '',
        'quiz': '',
        'solution': ''
    }
    
    # 直接生成 HTML，不再呼叫 generate_lesson_html
    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{unit_info['id']}: {unit_info['title']} | APCS 太空探險課程</title>
    <link rel="stylesheet" href="../../styles/main.css">
    <link rel="stylesheet" href="../../styles/lesson.css">
</head>
<body>
    <h1>課程開發中</h1>
    <p>{unit_info['title']}</p>
</body>
</html>"""
    return html

def main():
    """主函數"""
    print("🚀 開始生成所有 APCS 課程頁面...")
    print("=" * 60)
    
    # 建立所有單元的列表
    all_units = []
    for level in LESSONS_CONFIG:
        for unit in level['units']:
            all_units.append({
                'level': level,
                'unit': unit
            })
    
    # 生成每個課程頁面
    generated_count = 0
    for i, item in enumerate(all_units):
        level = item['level']
        unit = item['unit']
        
        # 計算上一課和下一課的連結
        if i > 0:
            prev_unit = all_units[i-1]
            prev_link = f"../{prev_unit['level']['level']}/{prev_unit['unit']['id']}.html"
        else:
            prev_link = ""
        
        if i < len(all_units) - 1:
            next_unit = all_units[i+1]
            next_link = f"../{next_unit['level']['level']}/{next_unit['unit']['id']}.html"
        else:
            next_link = ""
        
        print(f"\n📝 生成 {level['level']}-{unit['id']}: {unit['title']}")
        
        # 生成 HTML
        html = generate_lesson_html(level, unit, prev_link, next_link)
        
        # 寫入文件
        output_dir = LESSONS_DIR / level['level']
        output_file = output_dir / f"{unit['id']}.html"
        write_file(output_file, html)
        
        print(f"   ✅ 已生成：{output_file}")
        generated_count += 1
    
    print("\n" + "=" * 60)
    print(f"🎉 完成！共生成 {generated_count} 個課程頁面")
    print(f"📁 輸出目錄：{LESSONS_DIR}")
    print("\n📋 生成的課程：")
    for level in LESSONS_CONFIG:
        print(f"\n  {level['icon']} {level['level_name']} ({level['level']})")
        for unit in level['units']:
            print(f"     ✓ {unit['id']}: {unit['title']}")

if __name__ == "__main__":
    main()
