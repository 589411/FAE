import os
import json
from bs4 import BeautifulSoup
import re

def extract_game_info(html_content):
    """從HTML內容提取遊戲信息"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 提取標題
    title = soup.title.string if soup.title else ""
    
    # 基於內容分析標籤
    content_text = soup.get_text().lower()
    
    tags = {
        "difficulty_level": [],
        "age_group": [],
        "ai_topic": [],
        "steam_topic": {
            "science": [],
            "technology": [],
            "engineering": [],
            "arts": [],
            "mathematics": []
        },
        "skill_focus": [],
        "interaction_type": [],
        "duration": []
    }
    
    # AI主題判斷
    ai_keywords = {
        "machine_learning": ["機器學習", "ml", "人工智慧", "ai", "深度學習"],
        "computer_vision": ["電腦視覺", "影像辨識", "圖像處理"],
        "nlp": ["自然語言", "語音辨識", "文字處理"],
        "robotics": ["機器人", "自動化"],
        "ai_ethics": ["ai倫理", "人工智慧倫理", "科技倫理"],
        "neural_networks": ["神經網路", "類神經", "深度學習"],
        "data_science": ["數據科學", "資料科學", "大數據"],
        "ai_applications": ["ai應用", "人工智慧應用"]
    }
    
    for topic, keywords in ai_keywords.items():
        if any(keyword in content_text for keyword in keywords):
            tags['ai_topic'].append(topic)
    
    # STEAM主題判斷
    steam_keywords = {
        "science": {
            "physics": ["物理", "力學", "運動"],
            "chemistry": ["化學", "分子", "元素"],
            "biology": ["生物", "生命", "生態"],
            "astronomy": ["天文", "太空", "星球"],
            "earth_science": ["地球科學", "地質", "氣候"]
        },
        "technology": {
            "programming": ["程式", "編程", "coding"],
            "digital_literacy": ["數位素養", "資訊素養"],
            "cybersecurity": ["網路安全", "資安"],
            "iot": ["物聯網", "感測器"]
        },
        "engineering": {
            "mechanical": ["機械", "結構", "動力"],
            "electrical": ["電機", "電路", "電子"],
            "software": ["軟體", "系統", "程式"],
            "robotics": ["機器人", "自動化"]
        },
        "arts": {
            "digital_art": ["數位藝術", "電腦繪圖"],
            "design": ["設計思考", "創意設計"],
            "creative_computing": ["創意程式", "運算藝術"],
            "multimedia": ["多媒體", "影音"]
        },
        "mathematics": {
            "algebra": ["代數", "方程式"],
            "geometry": ["幾何", "空間"],
            "statistics": ["統計", "機率"],
            "logic": ["邏輯", "推理"]
        }
    }
    
    for category, subjects in steam_keywords.items():
        for subject, keywords in subjects.items():
            if any(keyword in content_text for keyword in keywords):
                tags['steam_topic'][category].append(subject)
    
    # 技能重點判斷
    skill_keywords = {
        "logical_thinking": ["邏輯思維", "邏輯推理"],
        "problem_solving": ["解決問題", "問題解決"],
        "creativity": ["創意", "創造力"],
        "computational_thinking": ["運算思維", "計算思維"],
        "critical_thinking": ["批判思考", "批判性思維"],
        "collaboration": ["團隊合作", "協作"],
        "communication": ["溝通", "表達"],
        "data_analysis": ["數據分析", "資料分析"]
    }
    
    for skill, keywords in skill_keywords.items():
        if any(keyword in content_text for keyword in keywords):
            tags['skill_focus'].append(skill)
    
    # 互動類型判斷
    interaction_keywords = {
        "game": ["遊戲"],
        "simulation": ["模擬"],
        "experiment": ["實驗"],
        "project": ["專案", "項目"],
        "story": ["故事", "劇情"],
        "challenge": ["挑戰", "競賽"]
    }
    
    for type_, keywords in interaction_keywords.items():
        if any(keyword in content_text for keyword in keywords):
            tags['interaction_type'].append(type_)
    
    return {
        'title': title,
        'tags': tags
    }

def process_existing_games(games_dir):
    """處理現有的遊戲文件"""
    for root, dirs, files in os.walk(games_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                
                # 讀取HTML內容
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # 提取遊戲信息
                game_info = extract_game_info(html_content)
                
                # 創建metadata文件
                metadata_path = os.path.join(os.path.dirname(file_path), 'metadata.json')
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(game_info, f, ensure_ascii=False, indent=4)
                
                # 更新HTML文件，添加meta標籤
                soup = BeautifulSoup(html_content, 'html.parser')
                head = soup.head
                
                # 添加meta標籤
                for category, values in game_info['tags'].items():
                    if isinstance(values, dict):
                        for sub_category, sub_values in values.items():
                            if sub_values:
                                meta = soup.new_tag('meta')
                                meta['name'] = f'tags-{category}-{sub_category}'
                                meta['content'] = ','.join(sub_values)
                                head.append(meta)
                    elif values:
                        meta = soup.new_tag('meta')
                        meta['name'] = f'tags-{category}'
                        meta['content'] = ','.join(values)
                        head.append(meta)
                
                # 保存更新後的HTML
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(str(soup))

if __name__ == '__main__':
    games_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'games')
    process_existing_games(games_dir)
