// 遊戲數據
const gameItems = [
    {
        id: 'wrench',
        name: '扳手',
        image: 'images/wrench.png',
        category: 'tools',
        features: ['金屬材質', '用於維修', '可重複使用']
    },
    {
        id: 'screwdriver',
        name: '螺絲起子',
        image: 'images/screwdriver.png',
        category: 'tools',
        features: ['精密工具', '維修必備', '手動操作']
    },
    {
        id: 'microscope',
        name: '顯微鏡',
        image: 'images/microscope.png',
        category: 'equipment',
        features: ['光學設備', '精密觀察', '科學研究']
    },
    {
        id: 'telescope',
        name: '望遠鏡',
        image: 'images/telescope.png',
        category: 'equipment',
        features: ['觀測設備', '遠距離觀察', '天體研究']
    },
    {
        id: 'food-pack',
        name: '太空食品包',
        image: 'images/food-pack.png',
        category: 'food',
        features: ['密封包裝', '營養均衡', '長期保存']
    },
    {
        id: 'water-pack',
        name: '飲用水包',
        image: 'images/water-pack.png',
        category: 'food',
        features: ['液體補充', '特殊包裝', '基本生存需求']
    }
];

let score = 0;
let attempts = 0;

// 初始化遊戲
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

// 初始化遊戲
function initializeGame() {
    const itemsContainer = document.querySelector('.items-container');
    if (!itemsContainer) return;

    // 清空容器
    itemsContainer.innerHTML = '';

    // 隨機排序物品
    const shuffledItems = [...gameItems].sort(() => Math.random() - 0.5);

    // 添加物品
    shuffledItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.draggable = true;
        itemElement.dataset.category = item.category;
        itemElement.dataset.id = item.id;
        
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <p>${item.name}</p>
            <ul>
                ${item.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        `;

        // 添加拖曳事件監聽器
        itemElement.addEventListener('dragstart', drag);
        
        itemsContainer.appendChild(itemElement);
    });

    // 為所有分類區域添加事件監聽器
    document.querySelectorAll('.category').forEach(category => {
        category.addEventListener('dragover', allowDrop);
        category.addEventListener('drop', drop);
    });

    updateScore();
}

// 拖曳功能
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    const item = ev.target.closest('.item');
    if (item) {
        ev.dataTransfer.setData("text", item.dataset.id);
    }
}

function drop(ev) {
    ev.preventDefault();
    const itemId = ev.dataTransfer.getData("text");
    const item = document.querySelector(`.item[data-id="${itemId}"]`);
    const targetCategory = ev.target.closest('.category-items');
    
    if (item && targetCategory) {
        targetCategory.appendChild(item);

        const itemCategory = item.dataset.category;
        const targetCategoryType = targetCategory.dataset.category;

        attempts++;
        console.log('嘗試放置:', itemId, '到', targetCategoryType); // 調試用
        
        if (itemCategory === targetCategoryType) {
            score += 10;
            showFeedback(true, `正確！這個物品屬於${getCategoryName(targetCategoryType)}類別。`);
        } else {
            score = Math.max(0, score - 5);
            showFeedback(false, '試試看其他類別？');
            return;
        }

        updateScore();
        checkGameComplete();
    }
}

// 更新分數顯示
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `分數: ${score} | 嘗試次數: ${attempts}`;
    }
}

// 顯示反饋
function showFeedback(isCorrect, message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    
    setTimeout(() => {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }, 2000);
}

// 檢查遊戲是否完成
function checkGameComplete() {
    const itemsContainer = document.getElementById('items');
    if (itemsContainer.children.length === 0) {
        const finalScore = Math.round((score / attempts) * 100);
        showFeedback(true, `恭喜完成！最終得分：${finalScore}分`);
        
        setTimeout(() => {
            if (confirm('要再玩一次嗎？')) {
                resetGame();
            }
        }, 2000);
    }
}

// 重置遊戲
function resetGame() {
    // 重置所有狀態
    document.querySelectorAll('.item').forEach(item => {
        item.classList.remove('correct', 'incorrect');
    });

    // 返回第一步
    showNextStep(1);
    
    // 重新初始化遊戲
    initializeGame();
}

// 檢查分類
function checkClassification() {
    let allCorrect = true;
    const categories = document.querySelectorAll('.category');
    
    categories.forEach(category => {
        const categoryType = category.dataset.category;
        const items = category.querySelectorAll('.item');
        
        items.forEach(item => {
            if (item.dataset.category !== categoryType) {
                allCorrect = false;
                item.classList.add('incorrect');
                item.classList.remove('correct');
            } else {
                item.classList.add('correct');
                item.classList.remove('incorrect');
            }
        });
    });

    if (allCorrect) {
        alert('太棒了！所有物品都分類正確！');
        showNextStep(3); // 如果全部正確，自動進入下一步
    } else {
        alert('還有一些物品需要重新分類，請檢查標記為紅色的物品。');
    }
}

// 顯示下一步
function showNextStep(stepNumber) {
    // 隱藏所有步驟
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // 顯示目標步驟
    const nextStep = document.getElementById(`step${stepNumber}`);
    if (nextStep) {
        nextStep.classList.add('active');
        
        // 如果是最後一步，添加特殊動畫效果
        if (stepNumber === 5) {
            animateSummarySection();
        }
    }
}

// 動畫效果
function animateSummarySection() {
    const elements = document.querySelectorAll('.summary-section, .thinking-section, .challenge-section');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'all 0.5s ease';
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        }, index * 200);
    });
}

// 載入新例子
function loadNewExample() {
    const newItem = gameItems[Math.floor(Math.random() * gameItems.length)];
    const newItemContainer = document.querySelector('.new-item');
    const resultContainer = document.querySelector('.result');
    const aiThinking = document.querySelector('.ai-thinking');

    // 清空之前的結果
    resultContainer.innerHTML = '';
    
    // 顯示新物品
    newItemContainer.innerHTML = `
        <div class="item">
            <img src="${newItem.image}" alt="${newItem.name}">
            <p>${newItem.name}</p>
            <ul>
                ${newItem.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
    `;

    // 顯示 AI 思考動畫
    aiThinking.innerHTML = '<p>AI正在分析...</p>';
    aiThinking.style.display = 'block';

    // 模擬 AI 思考時間
    setTimeout(() => {
        aiThinking.style.display = 'none';
        resultContainer.innerHTML = `
            <div class="analysis-result">
                <h4>分析結果</h4>
                <p>這個物品屬於 ${getCategoryName(newItem.category)}</p>
                <p>主要特徵：</p>
                <ul>
                    ${newItem.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        `;
    }, 2000);
}

// 獲取分類名稱
function getCategoryName(category) {
    const categoryNames = {
        'tools': '工具類',
        'equipment': '設備類',
        'food': '食品類'
    };
    return categoryNames[category] || category;
}
