class Shield {
    constructor(canvas, battery) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.battery = battery;
        
        // 防護罩的基本屬性
        this.baseRadius = 40;  // 基本防護罩半徑
        this.segments = 6;  // 六邊形的邊數
        this.rotation = Math.PI / 4;  // 45度角（π/4弧度）
        
        // 設置左右兩側的防護罩位置
        this.leftX = canvas.width * 0.25;  // 左側防護罩中心（燈的位置）
        this.rightX = canvas.width * 0.75; // 右側防護罩中心（風扇的位置）
        this.y = canvas.height - 150;      // 垂直位置
        
        // 自動模式設置
        this.isAutoMode = true;  // 預設為自動模式
        this.autoActivationThreshold = 80;  // 自動啟動閾值（電量百分比）
        this.autoDeactivationThreshold = 20;  // 自動關閉閾值（電量百分比）
        
        // 三片防護罩的設置（左中右）
        this.shields = [
            {
                isActive: false,
                opacity: 0,
                targetOpacity: 0,
                power: 4.0,  // 耗電量（瓦特）
                priority: 2,  // 最後啟動，最先關閉
                activationThreshold: 80,  // 啟動閾值
                x: this.leftX - 30,  // 左側防護罩（保護燈）
                y: this.y - 50
            },
            {
                isActive: false,
                opacity: 0,
                targetOpacity: 0,
                power: 3.0,
                priority: 1,
                activationThreshold: 60,  // 啟動閾值
                x: this.leftX + 30,  // 左側防護罩（保護燈）
                y: this.y
            },
            {
                isActive: false,
                opacity: 0,
                targetOpacity: 0,
                power: 2.0,
                priority: 0,  // 最先啟動，最後關閉
                activationThreshold: 40,  // 啟動閾值
                x: this.rightX,  // 右側防護罩（保護風扇）
                y: this.y - 25
            }
        ];
        
        // 視覺效果
        this.pulsePhase = 0;
        this.glowIntensity = 0;
        
        // 綁定事件
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a') {  // A鍵切換自動/手動模式
                this.toggleAutoMode();
            }
        });
    }

    toggleAutoMode() {
        this.isAutoMode = !this.isAutoMode;
        if (!this.isAutoMode) {
            // 切換到手動模式時，關閉所有防護罩
            this.shields.forEach(shield => {
                shield.isActive = false;
                shield.targetOpacity = 0;
            });
        }
        // 更新狀態面板
        this.updateStatusPanel(0);
    }
    
    update(deltaTime) {
        const deltaSeconds = deltaTime / 1000;
        let totalPower = 0;
        
        // 在自動模式下更新防護罩狀態
        if (this.isAutoMode) {
            const batteryLevel = this.battery.getLevel();
            
            // 根據電池電量自動控制每個防護罩
            this.shields.forEach(shield => {
                if (batteryLevel >= shield.activationThreshold) {
                    shield.isActive = true;
                    shield.targetOpacity = 0.8;
                } else if (batteryLevel < shield.activationThreshold - 10) {
                    // 添加一個10%的緩衝區，避免在閾值附近頻繁切換
                    shield.isActive = false;
                    shield.targetOpacity = 0;
                }
            });
        }
        
        // 更新每個防護罩
        this.shields.forEach((shield, index) => {
            if (shield.isActive && this.battery.getLevel() > 0) {
                shield.opacity = Math.min(shield.opacity + deltaSeconds * 2, shield.targetOpacity);
                totalPower += shield.power;
            } else {
                shield.opacity = Math.max(shield.opacity - deltaSeconds * 2, 0);
                if (shield.opacity === 0) {
                    shield.isActive = false;
                }
            }
        });
        
        // 消耗電量
        if (totalPower > 0) {
            this.battery.discharge(totalPower * deltaSeconds);
        }
        
        // 更新視覺效果
        this.rotation += deltaSeconds * 0.2;
        this.pulsePhase += deltaSeconds * 2;
        this.glowIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.2;
        
        // 更新狀態面板
        this.updateStatusPanel(totalPower);
    }

    getStatusText() {
        const activeCount = this.shields.filter(s => s.isActive).length;
        if (activeCount === 0) return '待機中';
        return `啟動 (${activeCount}/3)`;
    }
    
    updateStatusPanel(totalPower) {
        const shieldStatus = document.getElementById('shield-status');
        if (shieldStatus) {
            const modeText = this.isAutoMode ? '自動' : '手動';
            const powerText = totalPower > 0 ? `耗電量: ${totalPower.toFixed(1)}W` : '待機中';
            shieldStatus.textContent = `防護罩: ${modeText}模式 | ${this.getStatusText()} | ${powerText}`;
        }
    }
    
    drawHexagon(x, y, radius, rotation = 0) {
        this.ctx.beginPath();
        for (let i = 0; i <= this.segments; i++) {
            const angle = (i * Math.PI * 2 / this.segments) + rotation;
            const xPos = x + radius * Math.cos(angle);
            const yPos = y + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(xPos, yPos);
            } else {
                this.ctx.lineTo(xPos, yPos);
            }
        }
        this.ctx.closePath();
    }
    
    draw() {
        this.ctx.save();
        
        // 繪製每個防護罩
        this.shields.forEach((shield, index) => {
            if (shield.opacity <= 0) return;
            
            const radius = this.baseRadius * (1 + index * 0.2);  // 每層防護罩大小稍微遞增
            const rotationOffset = index * Math.PI / 6;  // 每層旋轉偏移
            
            // 主要防護罩
            this.drawHexagon(shield.x, shield.y, radius, this.rotation + rotationOffset);
            
            // 填充漸層
            const gradient = this.ctx.createRadialGradient(
                shield.x, shield.y, 0,
                shield.x, shield.y, radius
            );
            gradient.addColorStop(0, `rgba(100, 200, 255, ${shield.opacity * 0.2})`);
            gradient.addColorStop(0.7, `rgba(100, 200, 255, ${shield.opacity * 0.1})`);
            gradient.addColorStop(1, `rgba(100, 200, 255, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // 邊緣發光效果
            this.ctx.strokeStyle = `rgba(150, 220, 255, ${shield.opacity * this.glowIntensity})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 內層防護罩
            this.drawHexagon(shield.x, shield.y, radius * 0.8, -this.rotation - rotationOffset);
            this.ctx.strokeStyle = `rgba(150, 220, 255, ${shield.opacity * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 能量紋路效果
            for (let i = 0; i < this.segments; i++) {
                const angle = (i * Math.PI * 2 / this.segments) + this.rotation + rotationOffset;
                const innerX = shield.x + radius * 0.3 * Math.cos(angle);
                const innerY = shield.y + radius * 0.3 * Math.sin(angle);
                const outerX = shield.x + radius * 0.9 * Math.cos(angle);
                const outerY = shield.y + radius * 0.9 * Math.sin(angle);
                
                this.ctx.beginPath();
                this.ctx.moveTo(innerX, innerY);
                this.ctx.lineTo(outerX, outerY);
                this.ctx.strokeStyle = `rgba(150, 220, 255, ${shield.opacity * 0.3})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }
}
