class SolarPanel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 太陽能板的基本屬性
        this.width = 120;
        this.height = 10;
        this.x = canvas.width / 4;  // 放在畫面左側
        this.y = canvas.height - 200;  // 離地面一段距離
        
        // 角度相關
        this.angle = 0;  // 初始角度
        this.targetAngle = 0;
        this.rotationSpeed = 2;  // 每幀旋轉的角度
        this.minAngle = -150;  // 最小角度
        this.maxAngle = 150;   // 最大角度
        
        // 模式相關
        this.autoTracking = false;  // 是否自動追蹤太陽
        
        // 效率相關
        this.efficiency = 0;  // 當前發電效率
        
        // 綁定事件處理器
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    if (!this.autoTracking) {
                        this.targetAngle = Math.max(this.minAngle, this.targetAngle - 5);
                    }
                    break;
                case 'ArrowRight':
                    if (!this.autoTracking) {
                        this.targetAngle = Math.min(this.maxAngle, this.targetAngle + 5);
                    }
                    break;
                case 'a':
                case 'A':
                    this.autoTracking = !this.autoTracking;
                    this.updateStatusPanel();
                    break;
            }
        });
    }

    update(sun) {
        if (this.autoTracking && sun) {
            // 計算太陽相對於太陽能板的角度
            const sunPos = sun.getPosition();
            const dx = sunPos.x - this.x;
            const dy = sunPos.y - this.y;
            const angleToSun = (Math.atan2(-dy, dx) * 180 / Math.PI);
            
            // 確保自動追蹤的角度也在允許範圍內
            this.targetAngle = Math.max(this.minAngle, Math.min(this.maxAngle, angleToSun));
        }

        // 平滑旋轉到目標角度
        if (this.angle !== this.targetAngle) {
            const diff = this.targetAngle - this.angle;
            if (Math.abs(diff) < this.rotationSpeed) {
                this.angle = this.targetAngle;
            } else {
                this.angle += Math.sign(diff) * this.rotationSpeed;
            }
        }

        // 計算發電效率
        if (sun) {
            const sunPos = sun.getPosition();
            // 計算太陽相對於太陽能板的角度
            const dx = sunPos.x - this.x;
            const dy = sunPos.y - this.y;
            const sunAngle = (Math.atan2(-dy, dx) * 180 / Math.PI);
            
            // 計算太陽能板的法線方向
            const normalAngle = this.angle + 90; // 太陽能板的法線方向
            
            // 計算法線與太陽方向的夾角
            let angleDiff = Math.abs(sunAngle - normalAngle);
            if (angleDiff > 180) {
                angleDiff = 360 - angleDiff;
            }
            
            // 只有當太陽照射在板子正面時才發電
            if (this.isFacingSun(sunAngle, normalAngle)) {
                // 當法線正對太陽時效率最高
                this.efficiency = Math.cos(angleDiff * Math.PI / 180);
                this.efficiency = Math.max(0, this.efficiency);  // 確保效率不為負
                
                // 考慮太陽光強度
                this.efficiency *= sun.getLightIntensity();
            } else {
                this.efficiency = 0; // 背面朝向太陽時不發電
            }
        } else {
            this.efficiency = 0;
        }

        this.updateStatusPanel();
    }

    // 判斷太陽能板是否正面朝向太陽
    isFacingSun(sunAngle, normalAngle) {
        // 將角度轉換到 0-360 範圍
        const normalizedSunAngle = ((sunAngle % 360) + 360) % 360;
        const normalizedNormalAngle = ((normalAngle % 360) + 360) % 360;
        
        // 計算太陽和法線之間的夾角
        let angleDiff = Math.abs(normalizedSunAngle - normalizedNormalAngle);
        if (angleDiff > 180) {
            angleDiff = 360 - angleDiff;
        }
        
        // 如果夾角小於90度，表示正面朝向太陽
        return angleDiff < 90;
    }

    updateStatusPanel() {
        const panelStatus = document.getElementById('panel-status');
        const efficiencyStatus = document.getElementById('efficiency');
        if (panelStatus) {
            panelStatus.textContent = `太陽能板角度: ${Math.round(this.angle)}° (${this.autoTracking ? '自動' : '手動'})`;
        }
        if (efficiencyStatus) {
            efficiencyStatus.textContent = `發電效率: ${Math.round(this.efficiency * 100)}%`;
        }
    }

    draw() {
        this.ctx.save();
        
        // 移動到太陽能板的位置並旋轉
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle * Math.PI / 180);
        
        // 繪製支架
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, 40);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // 繪製太陽能板本體
        this.ctx.fillStyle = '#4169E1';  // 深藍色
        this.ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 添加反光效果
        const gradient = this.ctx.createLinearGradient(
            -this.width/2, -this.height/2,
            this.width/2, this.height/2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        this.ctx.restore();
    }

    getEfficiency() {
        return this.efficiency;
    }

    isGenerating() {
        return this.efficiency > 0;
    }

    getMode() {
        return this.autoTracking ? '自動' : '手動';
    }
}
