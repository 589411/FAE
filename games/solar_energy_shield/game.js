// 遊戲主類
class Game {
    constructor() {
        console.log('初始化遊戲...');
        this.canvas = document.getElementById('gameCanvas');
        console.log('找到畫布:', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        console.log('獲取繪圖上下文:', this.ctx);
        
        // 設置畫布大小
        this.canvas.width = 800;
        this.canvas.height = 600;
        console.log('設置畫布大小:', this.canvas.width, this.canvas.height);
        
        // 初始化遊戲組件
        console.log('開始初始化組件...');
        this.sun = new Sun(this.canvas);
        console.log('太陽初始化完成');
        this.solarPanel = new SolarPanel(this.canvas);
        console.log('太陽能板初始化完成');
        this.battery = new Battery(this.canvas);
        console.log('電池初始化完成');
        this.shield = new Shield(this.canvas, this.battery);  // 傳入 battery 引用
        console.log('防護罩初始化完成');
        this.appliances = new Appliances(this.canvas, this.battery);  // 傳入 battery 引用
        console.log('家電初始化完成');
        
        // 遊戲狀態
        this.lastTime = 0;
        this.isPaused = false;
        
        // 開始遊戲循環
        console.log('開始遊戲循環');
        this.gameLoop();
        
        // 設置鍵盤控制
        this.setupControls();
        console.log('遊戲初始化完成');
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':  // 空格鍵：暫停遊戲
                    this.togglePause();
                    break;
                case 'ArrowLeft':  // 左方向鍵：向左旋轉太陽能板
                    if (!this.solarPanel.autoTracking) {  // 只在手動模式下響應
                        this.solarPanel.targetAngle = Math.max(this.solarPanel.minAngle, this.solarPanel.targetAngle - 5);
                    }
                    break;
                case 'ArrowRight':  // 右方向鍵：向右旋轉太陽能板
                    if (!this.solarPanel.autoTracking) {  // 只在手動模式下響應
                        this.solarPanel.targetAngle = Math.min(this.solarPanel.maxAngle, this.solarPanel.targetAngle + 5);
                    }
                    break;
                case 'ArrowUp':  // 上方向鍵：增加旋轉速度
                    this.solarPanel.rotationSpeed = Math.min(2, this.solarPanel.rotationSpeed + 0.05);
                    break;
                case 'ArrowDown':  // 下方向鍵：減少旋轉速度
                    this.solarPanel.rotationSpeed = Math.max(0.1, this.solarPanel.rotationSpeed - 0.05);
                    break;
                case 'a':  // A鍵：切換自動/手動模式
                case 'A':
                    this.solarPanel.toggleAutoTracking();  // 切換太陽能板自動模式
                    this.shield.toggleAutoMode();  // 切換防護罩自動模式
                    break;
            }
        });
    }
    
    update(deltaTime) {
        if (this.isPaused) return;
        
        // 更新各組件
        try {
            this.sun.update(deltaTime);
            this.solarPanel.update(this.sun, deltaTime);
            this.shield.update(deltaTime);  // 移除 battery 參數，因為已經在構造函數中傳入
            this.appliances.update(deltaTime);  // 更新家電
            
            // 計算發電量並更新電池
            const efficiency = this.solarPanel.getEfficiency() / 100;  // 轉換為 0-1 的值
            const powerGeneration = efficiency * 30;  // 增加發電量為30%/秒
            const chargeAmount = powerGeneration * deltaTime / 1000;
            console.log(`發電效率: ${efficiency * 100}%, 發電量: ${chargeAmount}`);
            this.battery.charge(chargeAmount);
            this.battery.update(this.solarPanel, deltaTime);  // 更新電池動畫
            
            // 更新發電量顯示
            const efficiency_display = document.getElementById('efficiency');
            if (efficiency_display) {
                efficiency_display.textContent = `發電效率: ${(efficiency * 100).toFixed(1)}%`;
            }
        } catch (error) {
            console.error('更新時發生錯誤:', error);
        }
    }
    
    draw() {
        try {
            // 清空畫布
            this.ctx.fillStyle = '#FFFFFF';  // 白色背景
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 繪製各組件
            console.log('開始繪製...');
            this.sun.draw();
            console.log('太陽繪製完成');
            this.shield.draw();
            console.log('防護罩繪製完成');
            this.solarPanel.draw();
            console.log('太陽能板繪製完成');
            this.battery.draw();
            console.log('電池繪製完成');
            this.appliances.draw();  // 繪製家電
            console.log('家電繪製完成');
        } catch (error) {
            console.error('繪製時發生錯誤:', error);
        }
    }
    
    gameLoop(currentTime = 0) {
        try {
            // 計算時間差
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // 更新和繪製
            this.update(deltaTime);
            this.draw();
            
            // 繼續循環
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('遊戲循環中發生錯誤:', error);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
}

// 當頁面加載完成後啟動遊戲
window.addEventListener('load', () => {
    console.log('頁面加載完成，準備啟動遊戲...');
    try {
        new Game();
    } catch (error) {
        console.error('遊戲啟動失敗:', error);
    }
});
