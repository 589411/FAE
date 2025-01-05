// 遊戲常量
const GAME_CONFIG = {
    SUN_ROTATION_SPEED: 0.001,
    ENERGY_GENERATION_RATE: 6, // 提高基礎發電量
    BATTERY_CAPACITY: 1000,
    SHIELD_ENERGY_COST: 5,
    BATTERY_CHARGE_RATE: 20, // 提高充電速率
    BATTERY_DISCHARGE_RATE: 15,
    DAY_LENGTH: 60000,
    METEOR_SPAWN_RATE: 3000,
    METEOR_SPEED: 3,
    SHIELD_RADIUS: 40,
    BASE_CENTER_X: 400,
    BASE_CENTER_Y: 450,
    BASE_RADIUS: 150,
    MAX_SOLAR_PANELS: 10,
    MAX_BATTERIES: 5,
    MAX_SHIELDS: 10,
    CANVAS_HEIGHT: 600,
    SUN_ORBIT_RADIUS: 250
};

// 遊戲狀態
const gameState = {
    powerGeneration: 0,
    powerStorage: 0,
    powerConsumption: 0,
    solarPanels: [],
    batteries: [],
    shields: [],
    meteors: [],
    moonTime: 0,
    sunAngle: 0,
    tutorial: true,
    dragging: null,
    dragOffset: { x: 0, y: 0 },
    baseHealth: 100,
    lastMeteorTime: 0,
    currentPlacement: null,
    distributionEfficiency: 1,
    mousePos: null
};

// 畫布設置
const surfaceCanvas = document.getElementById('surfaceCanvas');
const baseCanvas = document.getElementById('baseCanvas');
const surfaceCtx = surfaceCanvas.getContext('2d');
const baseCtx = baseCanvas.getContext('2d');

// 資源元素
const powerGenerationEl = document.getElementById('powerGeneration');
const powerStorageEl = document.getElementById('powerStorage');
const powerConsumptionEl = document.getElementById('powerConsumption');
const moonTimeEl = document.getElementById('moonTime');

// 遊戲初始化
function initGame() {
    // 設置畫布尺寸
    function resizeCanvas() {
        surfaceCanvas.width = surfaceCanvas.offsetWidth;
        surfaceCanvas.height = surfaceCanvas.offsetHeight;
        baseCanvas.width = baseCanvas.offsetWidth;
        baseCanvas.height = baseCanvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 開始遊戲循環
    requestAnimationFrame(gameLoop);

    // 設置事件監聽器
    setupEventListeners();
}

// 事件監聽器設置
function setupEventListeners() {
    // 開始遊戲按鈕
    document.getElementById('startGame').addEventListener('click', () => {
        document.getElementById('tutorial').style.display = 'none';
        gameState.tutorial = false;
    });

    // 建造按鈕事件
    const buildButtons = document.querySelectorAll('.build-btn');
    buildButtons.forEach(btn => {
        // 拖曳事件
        btn.addEventListener('dragstart', handleBuildDragStart);
        btn.addEventListener('drag', handleBuildDrag);
        btn.addEventListener('dragend', handleBuildDragEnd);
        
        // 點擊事件
        btn.addEventListener('click', () => {
            if (!btn.disabled) {
                startPlacement(btn.dataset.item);
            }
        });
    });

    // 畫布事件
    surfaceCanvas.addEventListener('click', handleSurfaceClick);
    baseCanvas.addEventListener('click', handleBaseClick);
    
    surfaceCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    surfaceCanvas.addEventListener('mousemove', handleCanvasMouseMove);
    surfaceCanvas.addEventListener('mouseup', handleCanvasMouseUp);
    
    baseCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    baseCanvas.addEventListener('mousemove', handleCanvasMouseMove);
    baseCanvas.addEventListener('mouseup', handleCanvasMouseUp);

    // 防止畫布的默認拖曳行為
    surfaceCanvas.addEventListener('dragover', e => e.preventDefault());
    baseCanvas.addEventListener('dragover', e => e.preventDefault());
    surfaceCanvas.addEventListener('drop', handleCanvasDrop);
    baseCanvas.addEventListener('drop', handleCanvasDrop);
}

// 處理建造按鈕的拖曳開始
function handleBuildDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.item);
    e.dataTransfer.effectAllowed = 'copy';
}

// 處理建造按鈕的拖曳
function handleBuildDrag(e) {
    // 可以添加視覺反饋
}

// 處理建造按鈕的拖曳結束
function handleBuildDragEnd(e) {
    // 清理任何視覺反饋
}

// 處理畫布的拖放
function handleCanvasDrop(e) {
    e.preventDefault();
    const itemType = e.dataTransfer.getData('text/plain');
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.target === surfaceCanvas && itemType === 'solarPanel') {
        placeSolarPanel(x, y);
    } else if (e.target === baseCanvas) {
        if (itemType === 'battery') {
            placeBattery(x, y);
        } else if (itemType === 'shield') {
            placeShield(x, y);
        }
    }
}

// 處理畫布的滑鼠按下事件
function handleCanvasMouseDown(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 檢查是否點擊了已存在的物件
    let clickedItem = null;
    
    if (e.target === surfaceCanvas) {
        clickedItem = gameState.solarPanels.find(panel => 
            Math.hypot(x - panel.x, y - panel.y) < 20
        );
    } else if (e.target === baseCanvas) {
        clickedItem = gameState.batteries.find(battery => 
            Math.hypot(x - battery.x, y - battery.y) < 20
        );
        if (!clickedItem) {
            clickedItem = gameState.shields.find(shield => 
                Math.hypot(x - shield.x, y - shield.y) < GAME_CONFIG.SHIELD_RADIUS
            );
        }
    }

    if (clickedItem) {
        gameState.dragging = clickedItem;
        gameState.dragOffset = {
            x: x - clickedItem.x,
            y: y - clickedItem.y
        };
        e.target.style.cursor = 'grabbing';
    }
}

// 處理畫布的滑鼠移動事件
function handleCanvasMouseMove(e) {
    if (!gameState.dragging) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gameState.dragging.x = x - gameState.dragOffset.x;
    gameState.dragging.y = y - gameState.dragOffset.y;
    
    // 記錄滑鼠位置
    gameState.mousePos = { x, y };
    
    // 更新拖動位置
    updateDragging(gameState.mousePos);
}

// 處理畫布的滑鼠放開事件
function handleCanvasMouseUp(e) {
    if (gameState.dragging) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 如果拖曳到畫布外，刪除物件
        if (x < 0 || x > e.target.width || y < 0 || y > e.target.height) {
            if (gameState.dragging.type === 'solarPanel') {
                gameState.solarPanels = gameState.solarPanels.filter(p => p !== gameState.dragging);
            } else if (gameState.dragging.type === 'battery') {
                gameState.batteries = gameState.batteries.filter(b => b !== gameState.dragging);
            } else if (gameState.dragging.type === 'shield') {
                gameState.shields = gameState.shields.filter(s => s !== gameState.dragging);
            }
            updateItemCounts();
        }

        gameState.dragging = null;
        e.target.style.cursor = 'default';
    }
}

// 開始放置物件
function startPlacement(itemType) {
    gameState.currentPlacement = {
        type: itemType,
        active: true
    };
    // 取消當前選中的物件
    gameState.selectedItem = null;
}

// 處理月球表面點擊
function handleSurfaceClick(e) {
    if (!gameState.currentPlacement?.active) return;
    
    const rect = surfaceCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState.currentPlacement.type === 'solarPanel') {
        placeSolarPanel(x, y);
        gameState.currentPlacement.active = false;
        updateBuildButtons();
        updateItemCounts();
    }
}

// 處理基地內部點擊
function handleBaseClick(e) {
    if (!gameState.currentPlacement?.active) return;
    
    const rect = baseCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState.currentPlacement.type === 'battery') {
        placeBattery(x, y);
        gameState.currentPlacement.active = false;
        updateBuildButtons();
        updateItemCounts();
    } else if (gameState.currentPlacement.type === 'shield') {
        placeShield(x, y);
        gameState.currentPlacement.active = false;
        updateBuildButtons();
        updateItemCounts();
    }
}

// 放置太陽能板
function placeSolarPanel(x, y) {
    if (gameState.solarPanels.length >= GAME_CONFIG.MAX_SOLAR_PANELS) {
        showMessage('已達到太陽能板數量上限！');
        return;
    }

    gameState.solarPanels.push({
        type: 'solarPanel',
        x: x,
        y: y,
        efficiency: 1,
        currentEfficiency: 0
    });
    
    playSound('buildSound');
    updateItemCounts();
}

// 放置電池
function placeBattery(x, y) {
    if (gameState.batteries.length >= GAME_CONFIG.MAX_BATTERIES) {
        showMessage('已達到儲能電池數量上限！');
        return;
    }
    gameState.batteries.push({
        type: 'battery',
        x: x,
        y: y,
        charge: 0,
        status: 'idle'
    });
    playSound('buildSound');
    updateItemCounts();
}

// 放置防護罩
function placeShield(x, y) {
    if (gameState.shields.length >= GAME_CONFIG.MAX_SHIELDS) {
        showMessage('已達到防護罩數量上限！');
        return;
    }
    gameState.shields.push({
        type: 'shield',
        x: x,
        y: y,
        health: 100,
        active: true,
        color: '#4A90E2' // 設置初始顏色
    });
    playSound('buildSound');
    updateItemCounts();
}

// 更新物件數量顯示
function updateItemCounts() {
    const solarPanelCount = document.getElementById('solarPanelCount');
    const batteryCount = document.getElementById('batteryCount');
    const shieldCount = document.getElementById('shieldCount');

    solarPanelCount.textContent = `${gameState.solarPanels.length}/${GAME_CONFIG.MAX_SOLAR_PANELS}`;
    batteryCount.textContent = `${gameState.batteries.length}/${GAME_CONFIG.MAX_BATTERIES}`;
    shieldCount.textContent = `${gameState.shields.length}/${GAME_CONFIG.MAX_SHIELDS}`;

    // 更新按鈕狀態
    updateBuildButtons();
}

// 更新建造按鈕狀態
function updateBuildButtons() {
    const solarPanelButton = document.querySelector('.build-btn[data-item="solarPanel"]');
    const batteryButton = document.querySelector('.build-btn[data-item="battery"]');
    const shieldButton = document.querySelector('.build-btn[data-item="shield"]');

    // 檢查太陽能板數量
    if (gameState.solarPanels.length >= GAME_CONFIG.MAX_SOLAR_PANELS) {
        solarPanelButton.disabled = true;
        solarPanelButton.title = '已達到太陽能板數量上限';
    } else {
        solarPanelButton.disabled = false;
        solarPanelButton.title = '放置太陽能板';
    }

    // 檢查電池數量和解鎖條件
    if (gameState.solarPanels.length >= 3) {
        if (gameState.batteries.length >= GAME_CONFIG.MAX_BATTERIES) {
            batteryButton.disabled = true;
            batteryButton.title = '已達到電池數量上限';
        } else {
            batteryButton.disabled = false;
            batteryButton.title = '放置儲能電池';
        }
    } else {
        batteryButton.disabled = true;
        batteryButton.title = '需要放置3個太陽能板來解鎖';
    }

    // 檢查防護罩數量和解鎖條件
    if (gameState.batteries.length >= 2) {
        if (gameState.shields.length >= GAME_CONFIG.MAX_SHIELDS) {
            shieldButton.disabled = true;
            shieldButton.title = '已達到防護罩數量上限';
        } else {
            shieldButton.disabled = false;
            shieldButton.title = '放置防護罩';
        }
    } else {
        shieldButton.disabled = true;
        shieldButton.title = '需要放置2個電池來解鎖';
    }
}

// 計算太陽能板發電量
function calculatePowerGeneration() {
    let totalGeneration = 0;
    
    // 獲取太陽位置
    const sunX = surfaceCanvas.width / 2 + Math.cos(gameState.sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
    const sunY = surfaceCanvas.height / 2 + Math.sin(gameState.sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;

    gameState.solarPanels.forEach(panel => {
        // 計算太陽能板到太陽的角度
        const dx = sunX - panel.x;
        const dy = sunY - panel.y;
        const angle = Math.atan2(dy, dx);
        
        // 計算太陽能板的朝向效率（假設太陽能板垂直向上）
        const normalAngle = -Math.PI / 2;
        let angleDiff = Math.abs(angle - normalAngle);
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }
        
        // 調整效率計算，使其更寬容
        const efficiency = Math.cos(angleDiff * 0.8); // 降低角度差異的影響
        panel.currentEfficiency = Math.max(0, efficiency);
        
        totalGeneration += GAME_CONFIG.ENERGY_GENERATION_RATE * panel.currentEfficiency;
    });

    // 更新遊戲狀態
    gameState.powerGeneration = totalGeneration;

    // 計算防護罩能量消耗
    const shieldConsumption = gameState.shields.length * GAME_CONFIG.SHIELD_ENERGY_COST;
    gameState.powerConsumption = shieldConsumption;

    // 計算電池充放電
    const powerBalance = totalGeneration - shieldConsumption;
    let remainingPower = powerBalance;

    // 計算總電池容量和充電狀態
    const totalBatteryCapacity = gameState.batteries.length * GAME_CONFIG.BATTERY_CAPACITY;
    const totalCurrentCharge = gameState.batteries.reduce((sum, battery) => sum + battery.charge, 0);
    const totalChargePercentage = totalBatteryCapacity > 0 ? (totalCurrentCharge / totalBatteryCapacity) * 100 : 0;

    if (powerBalance > 0) {
        // 有多餘的能量，給電池充電
        gameState.batteries.forEach(battery => {
            if (remainingPower <= 0) return;
            
            const spaceLeft = GAME_CONFIG.BATTERY_CAPACITY - battery.charge;
            const chargeAmount = Math.min(
                spaceLeft,
                GAME_CONFIG.BATTERY_CHARGE_RATE,
                remainingPower
            );
            
            if (chargeAmount > 0) {
                battery.charge += chargeAmount;
                remainingPower -= chargeAmount;
                battery.status = 'charging';
            } else if (battery.charge >= GAME_CONFIG.BATTERY_CAPACITY) {
                battery.status = 'full';
            } else {
                battery.status = 'idle';
            }
        });

        // 當有5個電池且充電足夠時，顯示提示
        if (gameState.batteries.length === GAME_CONFIG.MAX_BATTERIES && totalChargePercentage >= 90) {
            showMessage('電池系統已達到最佳狀態！');
        }
    } else {
        // 需要電池放電
        const powerNeeded = -powerBalance;
        let remainingNeed = powerNeeded;
        
        // 平均分配放電量
        const dischargePerBattery = remainingNeed / gameState.batteries.length;
        
        gameState.batteries.forEach(battery => {
            if (remainingNeed <= 0) return;
            
            const dischargeAmount = Math.min(
                battery.charge,
                dischargePerBattery,
                GAME_CONFIG.BATTERY_DISCHARGE_RATE,
                remainingNeed
            );
            
            if (dischargeAmount > 0) {
                battery.charge -= dischargeAmount;
                remainingNeed -= dischargeAmount;
                battery.status = 'discharging';
            } else {
                battery.status = 'empty';
            }
        });

        // 如果電池能量不足，停用部分防護罩
        if (remainingNeed > 0) {
            gameState.shields.forEach(shield => {
                shield.active = false;
            });
            showMessage('警告：能量不足，防護罩效能下降！');
        } else {
            gameState.shields.forEach(shield => {
                shield.active = true;
            });
        }
    }

    // 顯示電池系統狀態
    const batteryStatus = document.getElementById('batteryStatus');
    if (batteryStatus) {
        batteryStatus.textContent = `電池系統: ${Math.round(totalChargePercentage)}%`;
    }

    // 更新防護罩狀態
    const hasEnoughPower = powerBalance >= 0 || (powerBalance < 0 && totalCurrentCharge > 0);
    gameState.shields.forEach(shield => {
        shield.active = hasEnoughPower;
        shield.color = hasEnoughPower ? '#4A90E2' : '#FF4444';
    });
}

// 更新月球時間
function updateMoonTime() {
    gameState.moonTime = (Date.now() % GAME_CONFIG.DAY_LENGTH) / GAME_CONFIG.DAY_LENGTH;
    gameState.sunAngle = gameState.moonTime * Math.PI * 2;
    
    const hours = Math.floor(gameState.moonTime * 24);
    const minutes = Math.floor((gameState.moonTime * 24 * 60) % 60);
    moonTimeEl.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// 檢查成就
function checkAchievements() {
    // 太陽能大師
    if (gameState.solarPanels.length >= 5) {
        unlockAchievement('solarMaster');
    }

    // 能量大師
    if (gameState.batteries.length >= 3) {
        unlockAchievement('energyMaster');
    }

    // 防護罩建造者
    if (gameState.shields.length >= 2) {
        unlockAchievement('shieldBuilder');
    }
}

// 解鎖成就
function unlockAchievement(id) {
    const badge = document.getElementById(`${id}Badge`);
    if (badge && !badge.classList.contains('unlocked')) {
        badge.style.display = 'block';
        badge.classList.add('unlocked');
        playSound('successSound');
        showMessage(`恭喜！解鎖了新成就！`);
    }
}

// 顯示消息
function showMessage(text) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// 播放音效
function playSound(id) {
    const sound = document.getElementById(id);
    sound.currentTime = 0;
    sound.play().catch(() => {
        // 忽略播放錯誤
    });
}

// 生成隕石
function spawnMeteor() {
    const now = Date.now();
    if (now - gameState.lastMeteorTime > GAME_CONFIG.METEOR_SPAWN_RATE) {
        // 隨機決定隕石的生成位置（左、上、右三個方向）
        let x, y, angle;
        const side = Math.floor(Math.random() * 3); // 0: 左, 1: 上, 2: 右

        switch(side) {
            case 0: // 左邊
                x = -20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT / 2); // 只在上半部分生成
                angle = 0 + (Math.random() * 0.5 - 0.25);
                break;
            case 1: // 上邊
                x = Math.random() * baseCanvas.width;
                y = -20;
                angle = Math.PI / 2 + (Math.random() * 0.5 - 0.25);
                break;
            case 2: // 右邊
                x = baseCanvas.width + 20;
                y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT / 2);
                angle = Math.PI + (Math.random() * 0.5 - 0.25);
                break;
        }

        gameState.meteors.push({
            x: x,
            y: y,
            angle: angle,
            speed: GAME_CONFIG.METEOR_SPEED * (0.8 + Math.random() * 0.4)
        });
        gameState.lastMeteorTime = now;
    }
}

// 更新隕石位置
function updateMeteors() {
    // 移動隕石
    gameState.meteors.forEach(meteor => {
        meteor.x += Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
    });

    // 檢查隕石是否擊中防護罩或基地
    gameState.meteors = gameState.meteors.filter(meteor => {
        // 檢查是否擊中防護罩
        const hitShield = gameState.shields.some(shield => {
            const distance = Math.hypot(meteor.x - shield.x, meteor.y - shield.y);
            return distance < GAME_CONFIG.SHIELD_RADIUS;
        });

        if (hitShield) {
            playSound('alertSound');
            return false;
        }

        // 檢查是否擊中基地
        const distanceToBase = Math.hypot(
            meteor.x - GAME_CONFIG.BASE_CENTER_X,
            meteor.y - GAME_CONFIG.BASE_CENTER_Y
        );

        if (distanceToBase < GAME_CONFIG.BASE_RADIUS) {
            gameState.baseHealth -= 10;
            playSound('alertSound');
            if (gameState.baseHealth <= 0) {
                showMessage('基地受到嚴重損壞！請加強防護！');
                gameState.baseHealth = 100;
            }
            return false;
        }

        // 檢查是否超出畫面
        return meteor.x > -50 && meteor.x < baseCanvas.width + 50 &&
               meteor.y > -50 && meteor.y < baseCanvas.height + 50;
    });
}

// 繪製月球表面
function drawSurface() {
    surfaceCtx.clearRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);
    
    // 繪製背景
    surfaceCtx.fillStyle = '#1a1a2e';
    surfaceCtx.fillRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);

    // 繪製太陽
    const sunX = surfaceCanvas.width / 2 + Math.cos(gameState.sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
    const sunY = surfaceCanvas.height / 2 + Math.sin(gameState.sunAngle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
    
    // 繪製太陽軌道
    surfaceCtx.beginPath();
    surfaceCtx.strokeStyle = '#333';
    surfaceCtx.setLineDash([5, 5]);
    surfaceCtx.arc(surfaceCanvas.width / 2, surfaceCanvas.height / 2, GAME_CONFIG.SUN_ORBIT_RADIUS, 0, Math.PI * 2);
    surfaceCtx.stroke();
    surfaceCtx.setLineDash([]);

    // 繪製太陽
    surfaceCtx.beginPath();
    surfaceCtx.arc(sunX, sunY, 20, 0, Math.PI * 2);
    surfaceCtx.fillStyle = '#FFD700';
    surfaceCtx.fill();

    // 繪製太陽光線
    surfaceCtx.beginPath();
    surfaceCtx.moveTo(sunX, sunY);
    surfaceCtx.lineTo(surfaceCanvas.width / 2, surfaceCanvas.height);
    surfaceCtx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    surfaceCtx.stroke();

    // 繪製太陽能板
    gameState.solarPanels.forEach(panel => {
        // 根據效率改變顏色
        const efficiency = panel.currentEfficiency;
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
    
    // 繪製背景
    baseCtx.fillStyle = '#1a1a2e';
    baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

    // 繪製地平面
    baseCtx.fillStyle = '#333';
    baseCtx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT / 2, baseCanvas.width, GAME_CONFIG.CANVAS_HEIGHT / 2);

    // 繪製基地範圍
    baseCtx.beginPath();
    baseCtx.arc(GAME_CONFIG.BASE_CENTER_X, GAME_CONFIG.BASE_CENTER_Y, 
                GAME_CONFIG.BASE_RADIUS, Math.PI, 0);
    baseCtx.strokeStyle = '#666';
    baseCtx.setLineDash([5, 5]);
    baseCtx.stroke();
    baseCtx.setLineDash([]);

    // 繪製電池
    gameState.batteries.forEach(battery => {
        const height = 40;
        const chargeHeight = (battery.charge / GAME_CONFIG.BATTERY_CAPACITY) * height;
        
        // 根據狀態設置顏色
        let statusColor;
        switch (battery.status) {
            case 'charging':
                statusColor = '#4CAF50';
                break;
            case 'discharging':
                statusColor = '#FFC107';
                break;
            case 'full':
                statusColor = '#2196F3';
                break;
            case 'empty':
                statusColor = '#F44336';
                break;
            default:
                statusColor = '#666';
        }

        baseCtx.fillStyle = battery === gameState.dragging ? '#666' : '#333';
        baseCtx.fillRect(battery.x - 10, battery.y - 20, 20, height);
        
        baseCtx.fillStyle = statusColor;
        baseCtx.fillRect(battery.x - 10, battery.y - 20 + (height - chargeHeight), 20, chargeHeight);

        // 顯示電量百分比
        baseCtx.fillStyle = '#fff';
        baseCtx.font = '10px Arial';
        baseCtx.textAlign = 'center';
        const percentage = Math.round((battery.charge / GAME_CONFIG.BATTERY_CAPACITY) * 100);
        baseCtx.fillText(`${percentage}%`, battery.x, battery.y + 30);
    });

    // 繪製防護罩
    gameState.shields.forEach(shield => {
        baseCtx.beginPath();
        baseCtx.arc(shield.x, shield.y, GAME_CONFIG.SHIELD_RADIUS, 0, Math.PI * 2);
        baseCtx.strokeStyle = shield.color;
        baseCtx.lineWidth = 2;
        baseCtx.stroke();

        // 如果防護罩處於活動狀態，繪製內部填充
        if (shield.active) {
            baseCtx.fillStyle = `${shield.color}33`; // 33 是透明度
            baseCtx.fill();
        }
    });

    // 繪製隕石
    gameState.meteors.forEach(meteor => {
        baseCtx.beginPath();
        baseCtx.arc(meteor.x, meteor.y, 10, 0, Math.PI * 2);
        baseCtx.fillStyle = '#FF4444';
        baseCtx.fill();
    });
}

// 更新資源顯示
function updateResourceDisplay() {
    powerGenerationEl.textContent = gameState.powerGeneration.toFixed(1);
    powerStorageEl.textContent = gameState.powerStorage.toFixed(1);
    powerConsumptionEl.textContent = gameState.powerConsumption.toFixed(1);
}

// 遊戲主循環
function gameLoop() {
    updateMoonTime();
    calculatePowerGeneration();
    updateResourceDisplay();
    spawnMeteor();
    updateMeteors();
    
    drawSurface();
    drawBase();
    
    requestAnimationFrame(gameLoop);
}

// 啟動遊戲
initGame();

// 更新拖動位置
function updateDragging(mousePos) {
    if (!gameState.dragging || !mousePos) return;

    if (gameState.dragging.type === 'solarPanel') {
        // 計算最近的軌道點
        const dx = mousePos.x - surfaceCanvas.width / 2;
        const angle = Math.atan2(mousePos.y - surfaceCanvas.height / 2, dx);
        
        // 只允許在上半圓放置
        if (angle >= 0 && angle <= Math.PI) {
            gameState.dragging.x = surfaceCanvas.width / 2 + Math.cos(angle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
            gameState.dragging.y = surfaceCanvas.height / 2 + Math.sin(angle) * GAME_CONFIG.SUN_ORBIT_RADIUS;
        }
    } else {
        // 其他物件的拖動邏輯...
        gameState.dragging.x = mousePos.x;
        gameState.dragging.y = mousePos.y;
    }
}
