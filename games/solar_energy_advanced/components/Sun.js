class Sun {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 太陽的基本屬性
        this.radius = 30;
        this.resetPosition();
        
        // 移動相關
        this.speed = 0.5; // 每幀移動的像素
        
        // 光線相關
        this.rays = [];
        this.rayCount = 8;
        this.rayLength = 40;
        this.raySpeed = 0.02;
        this.rayAngle = 0;
    }

    resetPosition() {
        // 設置太陽的初始位置在畫布左側
        this.x = -this.radius;
        this.y = 100;
    }

    update(deltaTime) {
        // 更新太陽位置
        this.x += this.speed;
        
        // 如果太陽移出畫面右側，重置到左側
        if (this.x >= this.canvas.width + this.radius) {
            this.resetPosition();
        }
        
        // 更新光線動畫
        this.rayAngle += this.raySpeed;
        if (this.rayAngle >= Math.PI * 2) {
            this.rayAngle = 0;
        }
        
        // 更新狀態面板
        const sunStatus = document.getElementById('sun-status');
        if (sunStatus) {
            // 計算太陽在天空中的位置（0-180度）
            const position = Math.round((this.x / this.canvas.width) * 180);
            sunStatus.textContent = `太陽位置: ${position}°`;
        }
    }

    draw() {
        // 繪製光芒效果
        this.drawRays();
        
        // 繪製太陽本體
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700'; // 金色
        this.ctx.fill();
        
        // 添加漸變效果
        const gradient = this.ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#FFD700');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    drawRays() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rayAngle);
        
        // 繪製光線
        for (let i = 0; i < this.rayCount; i++) {
            const angle = (Math.PI * 2 / this.rayCount) * i;
            const rayLength = this.rayLength * (0.8 + Math.sin(this.rayAngle * 5) * 0.2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(
                Math.cos(angle) * rayLength,
                Math.sin(angle) * rayLength
            );
            
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    getPosition() {
        return {
            x: this.x,
            y: this.y
        };
    }

    getLightIntensity() {
        // 根據太陽高度計算強度
        // 正午時最強，早晚最弱
        const normalizedX = this.x / this.canvas.width;
        return Math.sin(normalizedX * Math.PI);
    }
}
