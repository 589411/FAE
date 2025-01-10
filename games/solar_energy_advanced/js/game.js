// 遊戲主類
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化遊戲組件
        this.sun = new Sun(this.canvas);
        this.solarPanel = new SolarPanel(this.canvas);
        this.battery = new Battery(this.canvas);
        this.appliances = new Appliances(this.canvas);
        
        // 遊戲狀態
        this.isPaused = false;
        this.lastTimestamp = 0;
        
        // 綁定空白鍵暫停/繼續
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.isPaused = !this.isPaused;
            }
        });
        
        // 開始遊戲循環
        this.gameLoop();
    }
    
    update(deltaTime) {
        if (this.isPaused) return;
        
        // 更新各個組件
        this.sun.update(deltaTime);
        this.solarPanel.update(this.sun);
        this.battery.update(this.solarPanel, deltaTime);
        this.appliances.update(this.battery, deltaTime);
    }
    
    draw() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製背景
        this.ctx.fillStyle = '#87CEEB';  // 天空藍
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製地面
        this.ctx.fillStyle = '#90EE90';  // 淺綠色
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // 繪製各個組件
        this.sun.draw();
        this.solarPanel.draw();
        this.battery.draw();
        this.appliances.draw();
        
        // 如果遊戲暫停，顯示暫停提示
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('暫停', this.canvas.width/2, this.canvas.height/2);
        }
    }
    
    gameLoop(timestamp = 0) {
        // 計算時間差
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // 更新和繪製
        this.update(deltaTime);
        this.draw();
        
        // 繼續遊戲循環
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

// 當頁面載入完成後開始遊戲
window.addEventListener('load', () => {
    const game = new Game();
});
