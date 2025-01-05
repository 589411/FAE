// 物品數據
const trainingData = [
    {
        name: '扳手',
        category: 'tools',
        features: {
            size: '中型',
            material: '金屬',
            purpose: '維修'
        },
        image: 'images/wrench.png',
        explanation: '工具類物品通常由金屬製成，用於維修和組裝太空設備。它們的大小適中，便於太空人操作。',
        characteristics: [
            '金屬材質，堅固耐用',
            '適中的大小，方便操作',
            '主要用於維修和組裝'
        ]
    },
    {
        name: '顯微鏡',
        category: 'equipment',
        features: {
            size: '大型',
            material: '複合材料',
            purpose: '研究'
        },
        image: 'images/microscope.png',
        explanation: '設備類物品通常體積較大，由精密的複合材料製成，主要用於科學研究和觀測。',
        characteristics: [
            '體積較大，需要固定放置',
            '精密的複合材料結構',
            '用於科學研究和觀測'
        ]
    },
    {
        name: '太空食品',
        category: 'food',
        features: {
            size: '小型',
            material: '塑膠包裝',
            purpose: '生存'
        },
        image: 'images/food-pack.png',
        explanation: '食品類物品通常體積小巧，有特殊的密封包裝，用於維持太空人的生存需求。',
        characteristics: [
            '體積小巧，易於儲存',
            '特殊密封包裝設計',
            '專為太空環境設計'
        ]
    }
];

// 測試數據
const testData = {
    tools: {
        name: '新扳手',
        category: 'tools',
        features: {
            size: '中型',
            material: '金屬',
            purpose: '維修'
        },
        image: 'images/wrench2.png'
    },
    equipment: {
        name: '新顯微鏡',
        category: 'equipment',
        features: {
            size: '大型',
            material: '複合材料',
            purpose: '研究'
        },
        image: 'images/microscope2.png'
    },
    food: {
        name: '新太空食品',
        category: 'food',
        features: {
            size: '小型',
            material: '塑膠包裝',
            purpose: '生存'
        },
        image: 'images/food-pack2.png'
    }
};

// 當前測試物品類別
let currentTestCategory = 'tools';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
    initializeExamples();
});

// 顯示指定步驟
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

// 初始化示例物品
function initializeExamples() {
    const exampleContainer = document.querySelector('.example-items');
    if (!exampleContainer) return;

    // 清空容器
    exampleContainer.innerHTML = '';

    // 先添加分類說明
    const explanationSection = document.createElement('div');
    explanationSection.className = 'category-explanations';
    explanationSection.innerHTML = `
        <h3>太空物品分類說明：</h3>
        <div class="explanation-grid">
            ${trainingData.map(item => `
                <div class="category-explanation">
                    <h4>${getCategoryName(item.category)}</h4>
                    <p>${item.explanation}</p>
                    <ul class="characteristics-list">
                        ${item.characteristics.map(char => `<li>${char}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;
    exampleContainer.appendChild(explanationSection);

    // 添加示例物品，按照工具、設備、食品的順序
    const itemsSection = document.createElement('div');
    itemsSection.className = 'items-grid';
    
    // 定義顯示順序
    const displayOrder = ['tools', 'equipment', 'food'];
    
    // 按順序創建物品元素
    displayOrder.forEach(category => {
        const item = trainingData.find(item => item.category === category);
        if (item) {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 100px;">
                <h3>${item.name}</h3>
                <p>類別：${getCategoryName(item.category)}</p>
            `;
            itemsSection.appendChild(itemElement);
        }
    });
    
    exampleContainer.appendChild(itemsSection);
}

// 顯示下一步
function showNextStep(nextStep) {
    showStep(nextStep);
    
    if (nextStep === 4) {
        const testItem = testData[currentTestCategory];
        const testContainer = document.querySelector('.new-item');
        if (testContainer) {
            testContainer.innerHTML = `
                <h3>新物品</h3>
                <img src="${testItem.image}" alt="${testItem.name}" style="width: 100px; height: 100px;">
                <div class="features">
                    <p>大小：${testItem.features.size}</p>
                    <p>材質：${testItem.features.material}</p>
                    <p>用途：${testItem.features.purpose}</p>
                </div>
            `;
            
            // 保存測試物品
            window.currentTestItem = testItem;
            
            // 顯示思考動畫
            const thinkingContainer = document.querySelector('.ai-thinking');
            if (thinkingContainer) {
                thinkingContainer.innerHTML = `
                    <div class="thinking-status">
                        <p>AI正在思考...</p>
                        <div class="thinking-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                `;
                
                // 3秒後顯示結果
                window.setTimeout(function() {
                    // 更新思考狀態
                    thinkingContainer.innerHTML = `
                        <div class="thinking-complete">
                            <p>分析完成！</p>
                            <div class="checkmark">✓</div>
                        </div>
                    `;
                    
                    // 顯示結果
                    const resultContainer = document.querySelector('.result');
                    if (resultContainer) {
                        const categoryName = getCategoryName(testItem.category);
                        const categoryData = trainingData.find(item => item.category === testItem.category);
                        
                        resultContainer.innerHTML = `
                            <h3>分類結果</h3>
                            <p>這是一個${categoryName}物品</p>
                            <div class="explanation">
                                <p>為什麼？</p>
                                <ul>
                                    <li>大小：${testItem.features.size}</li>
                                    <li>材質：${testItem.features.material}</li>
                                    <li>用途：${testItem.features.purpose}</li>
                                </ul>
                                <div class="category-info">
                                    <p><strong>${categoryName}的特點：</strong></p>
                                    <p>${categoryData.explanation}</p>
                                </div>
                            </div>
                        `;
                        resultContainer.classList.add('show');
                    }
                }, 3000);
            }
        }
    }
}

// 重置演示
function resetDemo() {
    showStep(1);
    
    // 清除所有容器
    const containers = [
        '.example-items',
        '.new-item',
        '.ai-thinking',
        '.result'
    ];
    
    containers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // 隨機選擇一個不同的測試類別
    const categories = Object.keys(testData);
    let newCategory;
    do {
        newCategory = categories[Math.floor(Math.random() * categories.length)];
    } while (newCategory === currentTestCategory && categories.length > 1);
    
    currentTestCategory = newCategory;
    
    // 重新初始化示例
    initializeExamples();
    
    // 移除結果的顯示狀態
    const resultContainer = document.querySelector('.result');
    if (resultContainer) {
        resultContainer.classList.remove('show');
    }
}

// 獲取類別的中文名稱
function getCategoryName(category) {
    const categoryNames = {
        'tools': '工具類',
        'equipment': '設備類',
        'food': '食品類'
    };
    return categoryNames[category] || category;
}
