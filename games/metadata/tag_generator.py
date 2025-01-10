import json
import os
import re
from typing import Dict, List

class TagGenerator:
    def __init__(self, tag_system_path: str):
        with open(tag_system_path, 'r', encoding='utf-8') as f:
            self.tag_system = json.load(f)

    def analyze_content(self, html_content: str) -> Dict[str, List[str]]:
        """分析HTML內容並生成相關標籤"""
        tags = {}
        
        # 分析難度級別
        if '入門' in html_content or '基礎' in html_content:
            tags['difficulty_level'] = ['beginner']
        elif '進階' in html_content or '中級' in html_content:
            tags['difficulty_level'] = ['intermediate']
        elif '專家' in html_content or '高級' in html_content:
            tags['difficulty_level'] = ['advanced']

        # 分析主題
        subjects = {
            'machine_learning': ['機器學習', 'ML', '人工智慧', 'AI'],
            'robotics': ['機器人', 'robot'],
            'programming': ['程式', '編程', 'coding'],
            'ai_ethics': ['AI倫理', '倫理', 'ethics'],
            'data_science': ['數據', '資料', 'data']
        }
        
        tags['subject'] = []
        for subject, keywords in subjects.items():
            if any(keyword in html_content for keyword in keywords):
                tags['subject'].append(subject)

        # 分析技能重點
        skills = {
            'logical_thinking': ['邏輯', '思維', 'logic'],
            'problem_solving': ['解決問題', '解決方案'],
            'creativity': ['創意', '創造', 'creative'],
            'computational_thinking': ['運算思維', '計算思維']
        }
        
        tags['skill_focus'] = []
        for skill, keywords in skills.items():
            if any(keyword in html_content for keyword in keywords):
                tags['skill_focus'].append(skill)

        return tags

    def generate_metadata(self, html_path: str) -> Dict:
        """為HTML文件生成metadata"""
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        tags = self.analyze_content(content)
        
        # 從HTML標題提取課程名稱
        title_match = re.search(r'<title>(.*?)</title>', content)
        title = title_match.group(1) if title_match else os.path.basename(html_path)
        
        metadata = {
            'title': title,
            'tags': tags,
            'path': html_path
        }
        
        return metadata

    def save_metadata(self, html_path: str, output_path: str):
        """生成並保存metadata"""
        metadata = self.generate_metadata(html_path)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=4)
        
        return metadata

def main():
    # 使用示例
    generator = TagGenerator('tag_system.json')
    
    # 遍歷games目錄下的所有HTML文件
    games_dir = '..'  # 相對於metadata目錄的games目錄路徑
    for root, dirs, files in os.walk(games_dir):
        for file in files:
            if file.endswith('.html'):
                html_path = os.path.join(root, file)
                output_path = os.path.join(
                    os.path.dirname(html_path),
                    'metadata.json'
                )
                generator.save_metadata(html_path, output_path)

if __name__ == '__main__':
    main()
