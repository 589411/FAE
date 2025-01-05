class Game {
    constructor() {
        console.log('Game constructor started');
        
        // 更新調試信息
        const debug = document.getElementById('debug');
        debug.textContent = 'Debug Info: 正在初始化遊戲...';
        
        // 初始化畫布
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            debug.textContent = 'Error: Canvas element not found';
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get canvas context');
            debug.textContent = 'Error: Could not get canvas context';
            return;
        }
        
        // 設置畫布大小
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 初始化遊戲對象
        this.sun = new Sun();
        this.solarPanel = new SolarPanel();
        this.battery = new Battery();
        this.building = new Building();
        
        // 初始化電子
        this.electrons = [];
        for (let i = 0; i < 10; i++) {
            this.electrons.push(new Electron(
                this.battery.getTerminalPositions().left.x,
                this.battery.getTerminalPositions().left.y
            ));
        }
        
        // 設置事件監聽
        this.setupEventListeners();
        
        // 更新調試信息
        debug.textContent = 'Debug Info: 遊戲初始化完成，開始遊戲循環';
        
        // 開始遊戲循環
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.solarPanel.rotateLeft();
                    break;
                case 'ArrowRight':
                    this.solarPanel.rotateRight();
                    break;
                case 'a':
                case 'A':
                    this.solarPanel.toggleAutoTracking();
                    break;
            }
        });
    }
    
    update() {
        // 更新太陽位置
        this.sun.update();
        
        // 更新太陽能板
        this.solarPanel.update(this.sun);
        
        // 更新電子
        const batteryTerminals = this.battery.getTerminalPositions();
        this.electrons.forEach(electron => {
            // 如果電子準備好充電且太陽能板正在發電
            if (electron.isReadyToCharge() && this.solarPanel.isGenerating()) {
                electron.startCharging(this.solarPanel.getEfficiency());
            }
            
            // 如果電子準備好工作且電池有電
            if (electron.isReadyToWork() && this.battery.getLevel() > 0) {
                electron.startWorking();
            }
            
            // 更新電子狀態
            electron.update(this.solarPanel.getEfficiency(), batteryTerminals);
            
            // 如果電子完成充電，增加電池電量
            if (electron.getState() === 'charging') {
                this.battery.charge(0.01);
            }
        });
        
        // 更新建築物
        this.building.update(this.battery);
        
        // 更新狀態面板
        this.updateStatusPanel();
    }
    
    updateStatusPanel() {
        document.getElementById('mode').textContent = 
            `模式：${this.solarPanel.getMode()}`;
        document.getElementById('efficiency').textContent = 
            `發電效率：${Math.round(this.solarPanel.getEfficiency() * 100)}%`;
        document.getElementById('battery').textContent = 
            `電池電量：${Math.round(this.battery.getLevel())}%`;
        document.getElementById('generation').textContent = 
            `發電狀態：${this.solarPanel.isGenerating() ? '發電中' : '未發電'}`;
        document.getElementById('light').textContent = 
            `燈光狀態：${this.building.isLightOn ? '開啟' : '關閉'}`;
    }
    
    drawCircuit() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        // 太陽能板到電池的連接
        this.ctx.moveTo(300, 200);
        this.ctx.lineTo(300, 400);
        
        // 電池到建築物的連接
        this.ctx.moveTo(520, 400);
        this.ctx.lineTo(580, 400);
        
        // 回路
        this.ctx.moveTo(580, 500);
        this.ctx.lineTo(580, 550);
        this.ctx.lineTo(250, 550);
        this.ctx.lineTo(250, 400);
        
        this.ctx.stroke();
    }
    
    render() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製背景
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製電路
        this.drawCircuit();
        
        // 繪製所有遊戲對象
        this.sun.draw(this.ctx);
        this.solarPanel.draw(this.ctx);
        this.battery.draw(this.ctx);
        this.building.draw(this.ctx);
        
        // 繪製電子
        this.electrons.forEach(electron => {
            electron.draw(this.ctx);
        });
        
        // 繪製一個測試矩形
        this.ctx.fillStyle = '#FF0000';  // 紅色
        this.ctx.fillRect(100, 100, 50, 50);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Sun {
    constructor() {
        this.x = 400;
        this.y = 200;
        this.progress = 0;
    }
    
    update() {
        this.progress += 0.1;
        if (this.progress >= 100) {
            this.progress = 0;
        }
        
        const angle = (this.progress / 100) * Math.PI;
        const radius = 250;
        this.x = 400 + radius * Math.cos(angle);
        this.y = 400 - radius * Math.sin(angle);
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    }
}

class SolarPanel {
    constructor() {
        this.angle = -45;
        this.efficiency = 0;
        this.isGenerating = false;
        this.autoTracking = false;
    }
    
    update(sun) {
        // 計算太陽相對於太陽能板的角度
        const sunAngle = Math.atan2(sun.y - 200, sun.x - 300) * 180 / Math.PI;
        const panelNormalAngle = this.angle + 90;
        
        // 計算角度差異（確保在 0-180 度範圍內）
        let angleDifference = Math.abs(sunAngle - panelNormalAngle);
        angleDifference = angleDifference > 180 ? 360 - angleDifference : angleDifference;
        
        // 當角度差異在30度內時才產生電力
        if (angleDifference <= 30) {
            // 角度越接近，效率越高
            this.efficiency = 1 - (angleDifference / 30);
            this.isGenerating = true;
        } else {
            this.efficiency = 0;
            this.isGenerating = false;
        }
        
        // 自動追蹤模式
        if (this.autoTracking) {
            this.angle = sunAngle - 90;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(300, 200);
        ctx.rotate(this.angle * Math.PI / 180);
        
        // 支架
        ctx.fillStyle = '#666';
        ctx.fillRect(-10, 0, 20, 100);
        
        // 面板
        ctx.fillStyle = '#1a75ff';
        ctx.fillRect(-50, -5, 100, 10);
        
        ctx.restore();
    }
    
    isGenerating() {
        return this.isGenerating;
    }
    
    getEfficiency() {
        return this.efficiency;
    }
    
    getMode() {
        return this.autoTracking ? '自動追蹤模式' : '手動控制模式';
    }
    
    rotateLeft() {
        this.angle -= 5;
    }
    
    rotateRight() {
        this.angle += 5;
    }
    
    toggleAutoTracking() {
        this.autoTracking = !this.autoTracking;
    }
}

class Battery {
    constructor() {
        this.level = 0;
    }
    
    charge(amount) {
        this.level += amount;
        if (this.level > 100) {
            this.level = 100;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#333';
        ctx.fillRect(250, 400, 300, 150);
        
        ctx.fillStyle = '#444';
        ctx.fillRect(270, 420, 260, 110);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(270, 420, 10, 110);
        ctx.fillRect(520, 420, 10, 110);
    }
    
    getLevel() {
        return this.level;
    }
    
    getTerminalPositions() {
        return {
            left: { x: 270, y: 420 },
            right: { x: 520, y: 420 }
        };
    }
}

class Building {
    constructor() {
        this.isLightOn = false;
    }
    
    update(battery) {
        if (battery.getLevel() > 50) {
            this.isLightOn = true;
        } else {
            this.isLightOn = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(580, 300, 100, 200);
        
        if (this.isLightOn) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(590, 320, 20, 20);
        }
    }
}

class Electron {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.state = 'idle';
        this.chargeLevel = 0;
    }
    
    isReadyToCharge() {
        return this.state === 'idle' && this.chargeLevel < 1;
    }
    
    isReadyToWork() {
        return this.state === 'idle' && this.chargeLevel >= 1;
    }
    
    startCharging(efficiency) {
        this.state = 'charging';
        this.chargeLevel += efficiency;
    }
    
    startWorking() {
        this.state = 'working';
    }
    
    update(efficiency, batteryTerminals) {
        if (this.state === 'charging') {
            this.chargeLevel += efficiency;
            if (this.chargeLevel >= 1) {
                this.state = 'idle';
            }
        } else if (this.state === 'working') {
            // 移動電子
            if (this.x < batteryTerminals.right.x) {
                this.x += 1;
            } else {
                this.state = 'idle';
            }
        }
    }
    
    getState() {
        return this.state;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
    }
}

// 當頁面加載完成後啟動遊戲
window.addEventListener('load', () => {
    console.log('Window load event fired, starting game...');
    const debug = document.getElementById('debug');
    debug.textContent = 'Debug Info: 正在初始化遊戲...';
    new Game();
});