class Battery {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 電池的基本屬性
        this.width = 60;
        this.height = 100;
        this.x = 100;  // 放在畫面左側
        this.y = canvas.height - 150;
        
        // 電量相關
        this.level = 50;  // 初始電量設為 50%
        this.maxLevel = 100;
        this.chargeRate = 0.5;  // 充電速率
        
        // 動畫相關
        this.glowIntensity = 0;
        this.glowDirection = 1;
    }

    update(solarPanel, deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        
        // 更新發光動畫
        this.glowIntensity += 0.05 * this.glowDirection;
        if (this.glowIntensity >= 1) {
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowDirection = 1;
        }

        // 更新狀態面板
        this.updateStatusPanel();
    }

    // 充電方法
    charge(amount) {
        const oldLevel = this.level;
        this.level = Math.min(this.maxLevel, this.level + amount);
        console.log(`電池充電: ${oldLevel} -> ${this.level} (充電量: ${amount})`);
        this.updateStatusPanel();
    }

    // 放電方法
    discharge(amount) {
        const oldLevel = this.level;
        this.level = Math.max(0, this.level - amount);
        console.log(`電池放電: ${oldLevel} -> ${this.level} (放電量: ${amount})`);
        this.updateStatusPanel();
    }

    updateStatusPanel() {
        const batteryStatus = document.getElementById('battery-level');
        if (batteryStatus) {
            batteryStatus.textContent = `電池電量: ${Math.round(this.level)}%`;
        }
    }

    draw() {
        this.ctx.save();
        
        // 繪製電池外殼
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(
            this.x - this.width/2,
            this.y - this.height/2,
            this.width,
            this.height
        );
        
        // 繪製電量條
        const levelHeight = (this.height - 10) * (this.level / this.maxLevel);
        const gradient = this.ctx.createLinearGradient(
            this.x - this.width/2,
            this.y + this.height/2,
            this.x - this.width/2,
            this.y + this.height/2 - levelHeight
        );
        
        // 使用綠色漸變
        gradient.addColorStop(0, '#4CAF50');  // 深綠色
        gradient.addColorStop(1, '#81C784');  // 淺綠色
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.x - this.width/2 + 5,
            this.y + this.height/2 - 5 - levelHeight,
            this.width - 10,
            levelHeight
        );
        
        // 繪製發光效果
        if (this.level > 0) {
            this.ctx.beginPath();
            this.ctx.rect(
                this.x - this.width/2 - 5,
                this.y - this.height/2 - 5,
                this.width + 10,
                this.height + 10
            );
            const glowGradient = this.ctx.createRadialGradient(
                this.x, this.y,
                0,
                this.x, this.y,
                this.width
            );
            glowGradient.addColorStop(0, `rgba(255, 255, 0, ${0.2 * this.glowIntensity})`);
            glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    // 獲取當前電量
    getLevel() {
        return this.level;
    }

    // 獲取最大電量
    getMaxLevel() {
        return this.maxLevel;
    }
}
