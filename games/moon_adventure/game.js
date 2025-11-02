// 全局變量
let surfaceCanvas, baseCanvas, surfaceCtx, baseCtx;
let powerGenerationEl, powerStorageEl, powerConsumptionEl, batteryStatusEl;

// 遊戲配置
const GAME_CONFIG = {
    SUN_ORBIT_RADIUS: 200,
    SUN_SIZE: 20,
    MAX_SOLAR_PANELS: 10,
    MAX_BATTERIES: 5,
    MAX_SHIELDS: 3,
    BASE_POWER_CONSUMPTION: 10,
    BATTERY_CAPACITY: 1000,
    SHIELD_POWER_COST: 20
};

// 遊戲狀態
const gameState = {
    sunAngle: 0,
    solarPanels: [],
    batteries: [],
    shields: [],
    meteors: [],
    powerGeneration: 0,
    powerStorage: 0,
    powerConsumption: GAME_CONFIG.BASE_POWER_CONSUMPTION,
    gameTime: 0,
    isGameOver: false,
    currentPlacement: null,
    dragging: null
};

// 初始化遊戲
function initGame() {
    // 獲取DOM元素
    surfaceCanvas = document.getElementById('surfaceCanvas');
    baseCanvas = document.getElementById('baseCanvas');
    surfaceCtx = surfaceCanvas.getContext('2d');
    baseCtx = baseCanvas.getContext('2d');
    powerGenerationEl = document.getElementById('powerGeneration');
    powerStorageEl = document.getElementById('powerStorage');
    powerConsumptionEl = document.getElementById('powerConsumption');
    batteryStatusEl = document.getElementById('batteryStatus');

    // 重置遊戲狀態
    Object.assign(gameState, {
        sunAngle: 0,
        solarPanels: [],
        batteries: [],
        shields: [],
        meteors: [],
        powerGeneration: 0,
        powerStorage: 0,
        powerConsumption: GAME_CONFIG.BASE_POWER_CONSUMPTION,
        gameTime: 0,
        isGameOver: false,
        currentPlacement: null,
        dragging: null
    });

    // 綁定事件監聽器
    setupEventListeners();
    
    // 開始遊戲循環
    gameLoop();
}

// 設置事件監聽器
function setupEventListeners() {
    surfaceCanvas.addEventListener('click', handleSurfaceClick);
    surfaceCanvas.addEventListener('mousemove', handleMouseMove);
    surfaceCanvas.addEventListener('mousedown', handleMouseDown);
    surfaceCanvas.addEventListener('mouseup', handleMouseUp);
}

// 遊戲主循環
function gameLoop() {
    if (!gameState.isGameOver) {
        updateGame();
        drawGame();
        requestAnimationFrame(gameLoop);
    }
}

// 更新遊戲狀態
function updateGame() {
    // 更新遊戲時間
    gameState.gameTime += 1/60; // 假設60FPS

    // 更新太陽位置
    gameState.sunAngle += 0.01;
    if (gameState.sunAngle >= Math.PI * 2) {
        gameState.sunAngle = 0;
    }

    // 計算發電量
    calculatePowerGeneration();

    // 更新UI
    updateUI();
}

// 繪製遊戲畫面
function drawGame() {
    drawSurface();
    drawBase();
}

// 繪製月球表面
function drawSurface() {
    surfaceCtx.clearRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);
    
    // 繪製背景
    surfaceCtx.fillStyle = '#1a1a2e';
    surfaceCtx.fillRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);

    // 繪製地平線
    surfaceCtx.fillStyle = '#333';
    surfaceCtx.fillRect(0, surfaceCanvas.height / 2, surfaceCanvas.width, surfaceCanvas.height / 2);

    // 計算太陽位置（限制在上半圓）
    const sunAngle = Math.PI + (gameState.sunAngle % (Math.PI * 2));
    const sunX = surfaceCanvas.width / 2 + Math.cos(sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
    const sunY = surfaceCanvas.height / 2 + Math.sin(sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;

    // 繪製太陽軌道（只顯示上半圓）
    surfaceCtx.beginPath();
    surfaceCtx.strokeStyle = '#333';
    surfaceCtx.setLineDash([5, 5]);
    surfaceCtx.arc(surfaceCanvas.width / 2, surfaceCanvas.height / 2, 
                   GAME_CONFIG.SUN_ORBIT_RADIUS, 0, Math.PI);
    surfaceCtx.stroke();
    surfaceCtx.setLineDash([]);

    // 只在太陽在上半圓時繪製
    if (sunY <= surfaceCanvas.height / 2) {
        // 繪製太陽光芒
        const rayCount = 12;
        const rayLength = 30;
        surfaceCtx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        surfaceCtx.lineWidth = 2;
        for (let i = 0; i < rayCount; i++) {
            const angle = (Math.PI * 2 / rayCount) * i;
            surfaceCtx.beginPath();
            surfaceCtx.moveTo(
                sunX + Math.cos(angle) * GAME_CONFIG.SUN_SIZE,
                sunY + Math.sin(angle) * GAME_CONFIG.SUN_SIZE
            );
            surfaceCtx.lineTo(
                sunX + Math.cos(angle) * (GAME_CONFIG.SUN_SIZE + rayLength),
                sunY + Math.sin(angle) * (GAME_CONFIG.SUN_SIZE + rayLength)
            );
            surfaceCtx.stroke();
        }

        // 繪製太陽本體
        surfaceCtx.beginPath();
        surfaceCtx.arc(sunX, sunY, GAME_CONFIG.SUN_SIZE, 0, Math.PI * 2);
        surfaceCtx.fillStyle = '#FFD700';
        surfaceCtx.fill();

        // 繪製太陽到基地的光線
        surfaceCtx.beginPath();
        surfaceCtx.moveTo(sunX, sunY);
        surfaceCtx.lineTo(surfaceCanvas.width / 2, surfaceCanvas.height);
        surfaceCtx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        surfaceCtx.lineWidth = 1;
        surfaceCtx.stroke();
    }

    // 繪製太陽能板
    gameState.solarPanels.forEach(panel => {
        // 根據效率改變顏色
        const efficiency = calculatePanelEfficiency(panel);
        const color = `rgb(${Math.round(74 + efficiency * 100)}, ${Math.round(144 + efficiency * 50)}, ${Math.round(226)})`; 

        surfaceCtx.fillStyle = panel === gameState.dragging ? '#666' : color;
        surfaceCtx.fillRect(panel.x - 15, panel.y - 15, 30, 30);

        // 顯示效率百分比
        surfaceCtx.fillStyle = '#fff';
        surfaceCtx.font = '12px Arial';
        surfaceCtx.textAlign = 'center';
        surfaceCtx.fillText(`${Math.round(efficiency * 100)}%`, panel.x, panel.y + 25);
    });
}

// 繪製基地內部
function drawBase() {
    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    
    // 繪製基地背景
    baseCtx.fillStyle = '#1a1a2e';
    baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

    // 繪製電池
    gameState.batteries.forEach(battery => {
        baseCtx.fillStyle = '#4A90E2';
        baseCtx.fillRect(battery.x - 20, battery.y - 30, 40, 60);
    });

    // 繪製防護罩
    gameState.shields.forEach(shield => {
        baseCtx.strokeStyle = '#E74C3C';
        baseCtx.beginPath();
        baseCtx.arc(shield.x, shield.y, 40, 0, Math.PI * 2);
        baseCtx.stroke();
    });
}

// 開始放置物件
function startPlacing(type) {
    switch(type) {
        case 'solarPanel':
            if (gameState.solarPanels.length >= GAME_CONFIG.MAX_SOLAR_PANELS) {
                showMessage('已達到太陽能板數量上限！');
                return;
            }
            gameState.currentPlacement = { type: 'solarPanel' };
            break;
        case 'battery':
            if (gameState.batteries.length >= GAME_CONFIG.MAX_BATTERIES) {
                showMessage('已達到電池數量上限！');
                return;
            }
            gameState.currentPlacement = { type: 'battery' };
            break;
        case 'shield':
            if (gameState.shields.length >= GAME_CONFIG.MAX_SHIELDS) {
                showMessage('已達到防護罩數量上限！');
                return;
            }
            gameState.currentPlacement = { type: 'shield' };
            break;
    }
}

// 處理表面點擊
function handleSurfaceClick(event) {
    if (!gameState.currentPlacement) return;

    const rect = surfaceCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    switch(gameState.currentPlacement.type) {
        case 'solarPanel':
            placeSolarPanel(x, y);
            break;
        case 'battery':
            placeBattery(x, y);
            break;
        case 'shield':
            placeShield(x, y);
            break;
    }

    gameState.currentPlacement = null;
}

// 放置太陽能板
function placeSolarPanel(x, y) {
    if (y < surfaceCanvas.height / 2) {
        showMessage('無法在天空中放置太陽能板！');
        return;
    }
    
    gameState.solarPanels.push({
        type: 'solarPanel',
        x: x,
        y: y,
        efficiency: 1,
        currentEfficiency: 0
    });
}

// 放置電池
function placeBattery(x, y) {
    if (y < surfaceCanvas.height / 2) {
        showMessage('無法在天空中放置電池！');
        return;
    }
    
    gameState.batteries.push({
        type: 'battery',
        x: x,
        y: y,
        charge: 0
    });
}

// 放置防護罩
function placeShield(x, y) {
    if (y < surfaceCanvas.height / 2) {
        showMessage('無法在天空中放置防護罩！');
        return;
    }
    
    gameState.shields.push({
        type: 'shield',
        x: x,
        y: y,
        active: true
    });
}

// 處理拖動
function handleMouseDown(event) {
    const rect = surfaceCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 檢查是否點擊到太陽能板
    gameState.solarPanels.forEach(panel => {
        if (Math.abs(panel.x - x) < 15 && Math.abs(panel.y - y) < 15) {
            gameState.dragging = panel;
        }
    });
}

function handleMouseMove(event) {
    if (gameState.dragging) {
        const rect = surfaceCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 確保不能拖到天空中
        if (y >= surfaceCanvas.height / 2) {
            gameState.dragging.x = x;
            gameState.dragging.y = y;
        }
    }
}

function handleMouseUp() {
    gameState.dragging = null;
}

// 計算太陽能板效率
function calculatePanelEfficiency(panel) {
    const sunAngle = Math.PI + (gameState.sunAngle % (Math.PI * 2));
    const sunX = surfaceCanvas.width / 2 + Math.cos(sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
    const sunY = surfaceCanvas.height / 2 + Math.sin(sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;

    // 計算太陽能板到太陽的向量
    const dx = sunX - panel.x;
    const dy = sunY - panel.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 基於距離和角度計算效率
    let efficiency = Math.max(0, 1 - distance / (surfaceCanvas.width * 0.8));
    
    // 如果太陽在地平線下方，效率為0
    if (sunY > surfaceCanvas.height / 2) {
        efficiency = 0;
    }

    return efficiency;
}

// 計算總發電量
function calculatePowerGeneration() {
    let totalGeneration = 0;
    gameState.solarPanels.forEach(panel => {
        const efficiency = calculatePanelEfficiency(panel);
        totalGeneration += efficiency * 100; // 每個面板最大發電量為100單位
    });

    gameState.powerGeneration = totalGeneration;

    // 更新儲存量
    const surplus = totalGeneration - gameState.powerConsumption;
    if (surplus > 0) {
        gameState.powerStorage = Math.min(
            gameState.powerStorage + surplus,
            GAME_CONFIG.BATTERY_CAPACITY * gameState.batteries.length
        );
    } else {
        gameState.powerStorage = Math.max(0, gameState.powerStorage + surplus);
    }
}

// 更新UI
function updateUI() {
    powerGenerationEl.textContent = Math.round(gameState.powerGeneration);
    powerStorageEl.textContent = Math.round(gameState.powerStorage);
    powerConsumptionEl.textContent = Math.round(gameState.powerConsumption);
    
    const maxStorage = GAME_CONFIG.BATTERY_CAPACITY * gameState.batteries.length;
    const batteryPercentage = maxStorage > 0 ? Math.round((gameState.powerStorage / maxStorage) * 100) : 0;
    batteryStatusEl.textContent = batteryPercentage + '%';
}

// 結束遊戲
function endGame() {
    gameState.isGameOver = true;
    
    // 計算遊戲統計
    const totalPowerGenerated = gameState.powerGeneration * gameState.gameTime;
    const avgEfficiency = gameState.solarPanels.length > 0 ? 
        gameState.solarPanels.reduce((sum, panel) => sum + calculatePanelEfficiency(panel), 0) / gameState.solarPanels.length : 0;

    // 更新統計資訊
    const statsDiv = document.getElementById('gameStats');
    statsDiv.innerHTML = `
        <h3>遊戲統計</h3>
        <ul>
            <li>遊戲時長: ${Math.round(gameState.gameTime)} 秒</li>
            <li>太陽能板數量: ${gameState.solarPanels.length}</li>
            <li>電池數量: ${gameState.batteries.length}</li>
            <li>防護罩數量: ${gameState.shields.length}</li>
            <li>平均發電效率: ${Math.round(avgEfficiency * 100)}%</li>
            <li>總發電量: ${Math.round(totalPowerGenerated)} 單位</li>
            <li>最大儲存容量: ${GAME_CONFIG.BATTERY_CAPACITY * gameState.batteries.length} 單位</li>
        </ul>
    `;

    document.getElementById('conclusion').classList.add('show-conclusion');
    document.getElementById('overlay').classList.add('show-overlay');
}

// 顯示消息
function showMessage(text) {
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
    }, 2000);
}
