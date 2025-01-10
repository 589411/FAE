import os
import stat

def create_pre_commit_hook():
    """創建pre-commit hook來自動處理標籤"""
    hook_content = """#!/bin/bash
# 檢查是否有新增或修改的HTML文件
changed_files=$(git diff --cached --name-only --diff-filter=AM | grep '\.html$')

if [ -n "$changed_files" ]; then
    # 運行標籤生成器
    python games/metadata/tag_existing_games.py

    # 將更新後的文件添加到暫存區
    for file in $changed_files; do
        metadata_file=$(dirname "$file")/metadata.json
        git add "$file"
        if [ -f "$metadata_file" ]; then
            git add "$metadata_file"
        fi
    done
fi
"""
    
    # 獲取git hooks目錄
    git_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.git')
    hooks_dir = os.path.join(git_dir, 'hooks')
    
    # 創建pre-commit hook
    hook_path = os.path.join(hooks_dir, 'pre-commit')
    with open(hook_path, 'w') as f:
        f.write(hook_content)
    
    # 設置執行權限
    st = os.stat(hook_path)
    os.chmod(hook_path, st.st_mode | stat.S_IEXEC)

if __name__ == '__main__':
    create_pre_commit_hook()
