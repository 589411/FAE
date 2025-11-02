#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
課程驗證腳本 - 檢查所有課程文件是否存在且有效
"""

from pathlib import Path
import os

# 課程配置
LESSONS = [
    ("L1", ["A1", "A2", "A3"]),
    ("L2", ["B1", "B2", "B3"]),
    ("L3", ["C1", "C2", "C3"]),
    ("L4", ["D1", "D2", "D3"]),
    ("L5", ["E1"]),
]

BASE_DIR = Path(__file__).parent
LESSONS_DIR = BASE_DIR / "lessons"

def verify_lessons():
    """驗證所有課程文件"""
    print("🔍 開始驗證課程文件...")
    print("=" * 60)
    
    total_lessons = 0
    valid_lessons = 0
    missing_lessons = []
    
    for level, units in LESSONS:
        print(f"\n📁 檢查 {level}...")
        level_dir = LESSONS_DIR / level
        
        if not level_dir.exists():
            print(f"   ❌ 目錄不存在：{level_dir}")
            missing_lessons.append(f"{level} (整個目錄)")
            continue
        
        for unit in units:
            total_lessons += 1
            html_file = level_dir / f"{unit}.html"
            
            if html_file.exists():
                file_size = html_file.stat().st_size
                if file_size > 1000:  # 至少 1KB
                    print(f"   ✅ {unit}.html ({file_size:,} bytes)")
                    valid_lessons += 1
                else:
                    print(f"   ⚠️  {unit}.html (檔案太小：{file_size} bytes)")
                    missing_lessons.append(f"{level}/{unit}")
            else:
                print(f"   ❌ {unit}.html 不存在")
                missing_lessons.append(f"{level}/{unit}")
    
    print("\n" + "=" * 60)
    print(f"\n📊 驗證結果：")
    print(f"   總課程數：{total_lessons}")
    print(f"   有效課程：{valid_lessons}")
    print(f"   缺失課程：{len(missing_lessons)}")
    
    if missing_lessons:
        print(f"\n❌ 缺失的課程：")
        for lesson in missing_lessons:
            print(f"   - {lesson}")
    else:
        print(f"\n🎉 所有課程文件都存在且有效！")
    
    print(f"\n完成率：{valid_lessons}/{total_lessons} ({valid_lessons/total_lessons*100:.1f}%)")
    
    return valid_lessons == total_lessons

if __name__ == "__main__":
    success = verify_lessons()
    exit(0 if success else 1)
