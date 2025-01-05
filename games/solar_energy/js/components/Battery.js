class Battery {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 電池的基本屬性
        this.width = 60;
        this.height = 100;
        this.x = canvas.width / 2;  // 放在畫面中間
        this.y = canvas.height - 150;
        
        // 電量相關
        this.level = 0;  // 當前電量（0-100）
        this.maxLevel = 100;
        this.chargeRate = 0.5;  // 充電速率
        
        // 動畫相關
        this.glowIntensity = 0;
        this.glowDirection = 1;
    }

    update(solarPanel, deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        
        // 更新電量
        if (solarPanel && solarPanel.isGenerating()) {
            // 根據太陽能板的效率充電
            const chargeAmount = solarPanel.getEfficiency() * this.chargeRate;
            this.level = Math.min(this.maxLevel, this.level + chargeAmount);
        }

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

    // 放電方法
    discharge(amount) {
        this.level = Math.max(0, this.level - amount);
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
        
        // 根據電量設置顏色
        if (this.level > 60) {
            gradient.addColorStop(0, '#4CAF50');  // 綠色
            gradient.addColorStop(1, '#81C784');
        } else if (this.level > 20) {
            gradient.addColorStop(0, '#FFC107');  // 黃色
            gradient.addColorStop(1, '#FFD54F');
        } else {
            gradient.addColorStop(0, '#F44336');  // 紅色
            gradient.addColorStop(1, '#E57373');
        }
        
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
                this.x - this.width/2,
                this.y - this.height/2,
                this.width,
                this.height
            );
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${this.glowIntensity * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // 繪製電池頭
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(
            this.x - this.width/6,
            this.y - this.height/2 - 10,
            this.width/3,
            10
        );
        
        this.ctx.restore();
    }

    getLevel() {
        return this.level;
    }

    // 獲取電池端子位置（供電子動畫使用）
    getTerminalPositions() {
        return {
            top: {
                x: this.x,
                y: this.y - this.height/2
            },
            bottom: {
                x: this.x,
                y: this.y + this.height/2
            }
        };
    }
}
