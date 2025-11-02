class Game {
    constructor() {
        this.initializeCanvas();
        this.initializeDebug();
        this.initializeComponents();
        this.lastTime = 0;
        this.fps = 0;
        
        // 開始遊戲循環
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    initializeCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('找不到畫布元素');
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('無法獲取畫布上下文');
        }

        // 設置畫布大小
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    initializeComponents() {
        // 初始化太陽
        this.sun = new Sun(this.canvas);
        
        // 初始化太陽能板
        this.solarPanel = new SolarPanel(this.canvas);
        
        // 初始化電池
        this.battery = new Battery(this.canvas);
        
        // 初始化電器
        this.appliances = new Appliances(this.canvas);
        
        this.log('組件初始化完成');
    }

    initializeDebug() {
        this.debugInfo = document.getElementById('debug-info');
        this.fpsCounter = document.getElementById('fps-counter');
        this.log('遊戲初始化完成');
    }

    log(message) {
        if (this.debugInfo) {
            this.debugInfo.textContent = message;
            console.log(message);
        }
    }

    update(deltaTime) {
        // 更新 FPS
        this.fps = Math.round(1000 / deltaTime);
        if (this.fpsCounter) {
            this.fpsCounter.textContent = `FPS: ${this.fps}`;
        }

        // 更新太陽
        this.sun.update(deltaTime);
        
        // 更新太陽能板
        this.solarPanel.update(this.sun);
        
        // 更新電池
        this.battery.update(this.solarPanel, deltaTime);
        
        // 更新電器
        this.appliances.update(this.battery, deltaTime);
    }

    render() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 繪製背景
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 繪製太陽
        this.sun.draw();
        
        // 繪製太陽能板
        this.solarPanel.draw();
        
        // 繪製電池
        this.battery.draw();
        
        // 繪製電器
        this.appliances.draw();
    }

    gameLoop(currentTime) {
        // 計算時間差
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        try {
            this.update(deltaTime);
            this.render();
        } catch (error) {
            this.log(`錯誤：${error.message}`);
            console.error(error);
        }

        // 繼續遊戲循環
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// 當頁面加載完成後啟動遊戲
window.addEventListener('load', () => {
    try {
        new Game();
    } catch (error) {
        console.error('遊戲啟動失敗：', error);
        document.getElementById('debug-info').textContent = `錯誤：${error.message}`;
    }
});
