// 全局變量
let currentTool = 'safe';
let model;
let moonCanvas, missionCanvas;
let markers = [];
let isTraining = false;

// 初始化函數
async function initializeGame() {
    // 設置畫布
    moonCanvas = document.getElementById('moonCanvas');
    missionCanvas = document.getElementById('missionCanvas');
    setupCanvas(moonCanvas);
    setupCanvas(missionCanvas);

    // 初始化 TensorFlow 模型
    model = await createModel();
    
    // 載入月球圖像
    loadMoonImage(moonCanvas);
}

// 設置畫布
function setupCanvas(canvas) {
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // 添加事件監聽器
    canvas.addEventListener('click', handleCanvasClick);
}

// 創建 AI 模型
async function createModel() {
    const model = tf.sequential();
    
    // 添加卷積層
    model.add(tf.layers.conv2d({
        inputShape: [64, 64, 1],
        kernelSize: 3,
        filters: 16,
        activation: 'relu'
    }));
    model.add(tf.layers.maxPooling2d({poolSize: 2}));
    
    // 添加全連接層
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));
    
    // 編譯模型
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });
    
    return model;
}

// 處理畫布點擊
function handleCanvasClick(event) {
    const rect = event.target.getBoundingClientRect();
    const scaleX = event.target.width / rect.width;    // 計算畫布縮放比例
    const scaleY = event.target.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // 添加標記
    addMarker(x, y, currentTool);
    
    // 更新AI學習狀態顯示
    updateAIStatus();
}

// 添加標記
function addMarker(x, y, type) {
    const ctx = moonCanvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = type === 'safe' ? 'green' : 'red';
    ctx.fill();
    
    // 保存標記數據
    markers.push({x, y, type});
}

// 設置工具
function setTool(tool) {
    currentTool = tool;
    updateToolUI();
}

// 清除標記
function clearMarkers() {
    const ctx = moonCanvas.getContext('2d');
    ctx.clearRect(0, 0, moonCanvas.width, moonCanvas.height);
    markers = [];
    loadMoonImage(moonCanvas);
}

// 分析地形
async function analyzeTerrain() {
    if (markers.length < 10) {
        alert('請至少標記10個點以訓練AI（包含安全和危險區域）');
        return;
    }
    
    const safeCount = markers.filter(m => m.type === 'safe').length;
    const unsafeCount = markers.filter(m => m.type === 'unsafe').length;
    
    if (safeCount === 0 || unsafeCount === 0) {
        alert('請確保同時包含安全和危險區域的標記');
        return;
    }
    
    isTraining = true;
    updateLearningProgress('開始訓練AI模型...');
    
    try {
        // 準備訓練數據
        const trainingData = prepareTrainingData();
        
        // 訓練模型
        await trainModel(trainingData);
        
        // 分析新地形
        analyzeNewTerrain();
        
    } catch (error) {
        console.error('訓練過程出錯:', error);
        updateLearningProgress('訓練失敗，請重試');
    } finally {
        isTraining = false;
    }
}

// 準備訓練數據
function prepareTrainingData() {
    // 將標記轉換為訓練數據
    const xs = [];
    const ys = [];
    
    markers.forEach(marker => {
        // 獲取標記周圍的圖像數據
        const imageData = getImageDataAround(marker.x, marker.y);
        xs.push(imageData);
        ys.push(marker.type === 'safe' ? 1 : 0);
    });
    
    return {
        xs: tf.tensor4d(xs, [markers.length, 64, 64, 1]),
        ys: tf.tensor2d(ys, [markers.length, 1])
    };
}

// 訓練模型
async function trainModel(data) {
    const {xs, ys} = data;
    
    try {
        const history = await model.fit(xs, ys, {
            epochs: 10,
            batchSize: 4,
            validationSplit: 0.2,
            callbacks: {
                onEpochBegin: (epoch) => {
                    updateLearningProgress(`開始訓練週期 ${epoch + 1}/10`);
                },
                onEpochEnd: (epoch, logs) => {
                    const accuracy = (logs.acc * 100).toFixed(2);
                    const loss = logs.loss.toFixed(4);
                    updateLearningProgress(
                        `訓練週期 ${epoch + 1}/10 完成\n` +
                        `準確率: ${accuracy}%\n` +
                        `損失值: ${loss}`
                    );
                }
            }
        });
        
        // 顯示最終訓練結果
        const finalAccuracy = (history.history.acc[history.history.acc.length - 1] * 100).toFixed(2);
        updateLearningProgress(`訓練完成！最終準確率: ${finalAccuracy}%`);
        
    } catch (error) {
        console.error('模型訓練失敗:', error);
        throw error;
    }
}

// 分析新地形
async function analyzeNewTerrain() {
    const ctx = missionCanvas.getContext('2d');
    
    // 清除舊的分析結果
    ctx.clearRect(0, 0, missionCanvas.width, missionCanvas.height);
    
    // 載入新的月球地形
    const img = new Image();
    img.src = 'images/moon_surface.jpg';
    
    img.onload = async () => {
        // 繪製月球地形
        ctx.drawImage(img, 0, 0, missionCanvas.width, missionCanvas.height);
        
        // 創建分析網格
        const gridSize = 40;
        const results = [];
        
        // 遍歷畫布，進行區域分析
        for(let x = 0; x < missionCanvas.width; x += gridSize) {
            for(let y = 0; y < missionCanvas.height; y += gridSize) {
                const imageData = ctx.getImageData(x, y, gridSize, gridSize);
                const tensorData = tf.browser.fromPixels(imageData, 1);
                const resized = tf.image.resizeBilinear(tensorData, [64, 64]);
                const normalized = resized.div(255.0);
                const prediction = await model.predict(normalized.expandDims()).data();
                
                results.push({
                    x, y,
                    confidence: prediction[0]
                });
                
                // 釋放記憶體
                tensorData.dispose();
                resized.dispose();
                normalized.dispose();
            }
        }
        
        // 繪製分析結果
        results.forEach(result => {
            const color = `rgba(${result.confidence < 0.5 ? 255 : 0}, ${result.confidence >= 0.5 ? 255 : 0}, 0, 0.3)`;
            ctx.fillStyle = color;
            ctx.fillRect(result.x, result.y, gridSize, gridSize);
        });
        
        // 找出最佳著陸點
        const bestSpot = results.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        , results[0]);
        
        // 標記最佳著陸點
        ctx.beginPath();
        ctx.arc(bestSpot.x + gridSize/2, bestSpot.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 更新分析結果顯示
        displayAnalysisResults(bestSpot.confidence);
    };
}

// 顯示分析結果
function displayAnalysisResults(confidence) {
    const resultsDiv = document.getElementById('analysis-results');
    const safetyLevel = confidence >= 0.7 ? '高' : confidence >= 0.5 ? '中' : '低';
    const recommendation = confidence >= 0.7 ? '推薦著陸' : confidence >= 0.5 ? '謹慎著陸' : '不建議著陸';
    
    resultsDiv.innerHTML = `
        <div class="analysis-card ${safetyLevel === '高' ? 'safe' : safetyLevel === '中' ? 'caution' : 'danger'}">
            <h3>地形分析結果</h3>
            <p>安全指數: ${(confidence * 100).toFixed(1)}%</p>
            <p>安全等級: ${safetyLevel}</p>
            <p>建議: ${recommendation}</p>
            <div class="safety-meter">
                <div class="meter-fill" style="width: ${confidence * 100}%"></div>
            </div>
        </div>
    `;
}

// 選擇著陸點
function selectLandingSpot() {
    const ctx = missionCanvas.getContext('2d');
    
    // 添加點擊事件監聽器
    missionCanvas.addEventListener('click', async function onCanvasClick(event) {
        const rect = missionCanvas.getBoundingClientRect();
        const scaleX = missionCanvas.width / rect.width;
        const scaleY = missionCanvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        // 獲取點擊區域的圖像數據
        const imageData = ctx.getImageData(x - 32, y - 32, 64, 64);
        const tensorData = tf.browser.fromPixels(imageData, 1);
        const normalized = tensorData.div(255.0);
        const prediction = await model.predict(normalized.expandDims()).data();
        
        // 清除之前的選擇標記
        ctx.clearRect(0, 0, missionCanvas.width, missionCanvas.height);
        analyzeNewTerrain(); // 重新顯示分析結果
        
        // 添加選擇標記
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 顯示選擇結果
        displayAnalysisResults(prediction[0]);
        
        // 移除事件監聽器
        missionCanvas.removeEventListener('click', onCanvasClick);
        
        // 釋放記憶體
        tensorData.dispose();
        normalized.dispose();
    });
}

// 更新學習進度顯示
function updateLearningProgress(message) {
    const progressDiv = document.getElementById('learningProgress');
    progressDiv.innerHTML = `
        <div class="progress-message">
            <h4>AI學習狀態</h4>
            <p>${message.split('\n').join('<br>')}</p>
        </div>
    `;
}

// 載入月球圖像
function loadMoonImage(canvas) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = 'images/moon_surface.jpg';
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
}

// 頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', initializeGame);

// 步驟控制
function showNextStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step' + stepNumber).classList.add('active');
}

// 更新AI狀態顯示
function updateAIStatus() {
    const safeCount = markers.filter(m => m.type === 'safe').length;
    const unsafeCount = markers.filter(m => m.type === 'unsafe').length;
    
    const status = document.getElementById('aiConfidence');
    status.innerHTML = `
        <h4>當前標記統計</h4>
        <p>安全區域標記: ${safeCount} 個</p>
        <p>危險區域標記: ${unsafeCount} 個</p>
        <p>還需要至少 ${Math.max(0, 10 - (safeCount + unsafeCount))} 個標記才能開始訓練</p>
    `;
}
