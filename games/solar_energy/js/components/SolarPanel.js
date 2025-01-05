class SolarPanel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 太陽能板的基本屬性
        this.width = 120;
        this.height = 10;
        this.x = canvas.width / 2;  // 放在畫面中間
        this.y = canvas.height - 200;  // 離地面一段距離
        
        // 角度相關
        this.angle = 0;  // 初始角度
        this.targetAngle = 0;
        this.rotationSpeed = 2;  // 每幀旋轉的角度
        this.minAngle = -85;  // 最小角度（接近垂直）
        this.maxAngle = 85;   // 最大角度（接近垂直）
        
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
            
            // 計算太陽能板的法線方向（垂直於板面的方向）
            const normalAngle = this.angle + 90;
            
            // 計算太陽光線與法線的夾角
            let angleDiff = Math.abs(sunAngle - normalAngle);
            while (angleDiff > 180) {
                angleDiff = Math.abs(angleDiff - 360);
            }
            
            // 使用餘弦函數計算效率，當法線與太陽光線平行時效率最高
            this.efficiency = Math.cos(angleDiff * Math.PI / 180);
            this.efficiency = Math.max(0, this.efficiency);
            
            // 考慮太陽光強度
            this.efficiency *= sun.getLightIntensity();
        } else {
            this.efficiency = 0;
        }
        
        this.updateStatusPanel();
    }

    // 判斷太陽能板是否正面朝向太陽
    isFacingSun(sunAngle, normalAngle) {
        // 計算太陽和法線方向的夾角
        let angleDiff = Math.abs(sunAngle - normalAngle);
        if (angleDiff > 180) {
            angleDiff = 360 - angleDiff;
        }
        // 如果夾角小於90度，表示太陽照射在正面
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
        
        // 移動到太陽能板的位置
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle * Math.PI / 180);
        
        // 繪製太陽能板
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 繪製支架
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(-5, 0, 10, 50);
        
        this.ctx.restore();

        // 在太陽能板下方繪製控制提示
        this.ctx.save();
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#333';
        
        // 計算提示文字的位置（在太陽能板下方）
        const textY = this.y + 80;
        
        // 繪製左箭頭
        this.ctx.fillStyle = '#666';
        this.ctx.beginPath();
        this.ctx.moveTo(this.x - 60, textY);
        this.ctx.lineTo(this.x - 40, textY - 10);
        this.ctx.lineTo(this.x - 40, textY + 10);
        this.ctx.fill();
        
        // 繪製右箭頭
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + 60, textY);
        this.ctx.lineTo(this.x + 40, textY - 10);
        this.ctx.lineTo(this.x + 40, textY + 10);
        this.ctx.fill();
        
        // 繪製文字說明
        this.ctx.textAlign = 'center';
        this.ctx.fillText('← →', this.x, textY + 30);
        this.ctx.fillText('調整角度', this.x, textY + 50);
        
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
