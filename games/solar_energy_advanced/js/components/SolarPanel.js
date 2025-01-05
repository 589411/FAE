class SolarPanel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 太陽能板的基本屬性
        this.width = 120;
        this.height = 10;
        this.x = canvas.width / 2;  // 初始位置在畫面中間
        this.y = canvas.height - 200;
        
        // 角度相關
        this.angle = 0;
        this.targetAngle = 0;
        this.rotationSpeed = 0.1;  // 將速度從 0.25 降低到 0.1
        this.minAngle = -60;
        this.maxAngle = 60;
        this.autoDirection = 1;  // 1 表示順時針，-1 表示逆時針
        
        // 移動相關
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.minX = this.width;
        this.maxX = canvas.width - this.width;
        
        // 碰撞檢測區域（較大的區域用於滑鼠檢測）
        this.hitboxWidth = this.width * 2;  // 加大碰撞檢測區域
        this.hitboxHeight = this.height * 10;  // 加大碰撞檢測區域
        
        // 模式相關
        this.autoTracking = false;
        this.manualControl = false;
        this.paused = false;
        
        // 效率相關
        this.efficiency = 0;
        
        // 控制面板相關
        this.showControlPanel = false;
        this.controlPanelX = canvas.width - 220;  // 右側，留出一些邊距
        this.controlPanelY = canvas.height - 130;  // 調整回 130 的高度
        
        // 綁定事件處理器
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 鍵盤控制
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowRight':
                    // 如果在自動模式下，切換到手動模式
                    if (this.autoTracking) {
                        this.autoTracking = false;
                        this.updateStatusPanel();
                    }
                    // 調整角度
                    if (e.key === 'ArrowLeft') {
                        this.targetAngle = Math.max(this.minAngle, this.targetAngle - 5);
                    } else {
                        this.targetAngle = Math.min(this.maxAngle, this.targetAngle + 5);
                    }
                    break;
                case 'ArrowUp':
                    // 加快轉動速度
                    this.rotationSpeed = Math.min(2, this.rotationSpeed + 0.05);
                    this.updateStatusPanel();
                    break;
                case 'ArrowDown':
                    // 減慢轉動速度
                    this.rotationSpeed = Math.max(0.1, this.rotationSpeed - 0.05);
                    this.updateStatusPanel();
                    break;
                case ' ':
                    // 暫停/繼續
                    this.paused = !this.paused;
                    break;
                case 'a':
                case 'A':
                    this.toggleAutoTracking();
                    break;
            }
        });

        // 滑鼠拖曳控制
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            if (this.isPointInPanel(mouseX, mouseY)) {
                this.isDragging = true;
                this.dragOffsetX = mouseX - this.x;
                this.dragOffsetY = mouseY - this.y;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // 限制移動範圍
                this.x = Math.max(this.minX, Math.min(this.maxX, mouseX - this.dragOffsetX));
                this.y = Math.max(200, Math.min(this.canvas.height - 100, mouseY - this.dragOffsetY));
                
                // 更新控制面板位置
                this.controlPanelX = this.canvas.width - 220;
                this.controlPanelY = this.canvas.height - 130;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    isPointInPanel(x, y) {
        // 使用較大的碰撞檢測區域
        const hitboxLeft = this.x - this.hitboxWidth/2;
        const hitboxRight = this.x + this.hitboxWidth/2;
        const hitboxTop = this.y - this.hitboxHeight/2;
        const hitboxBottom = this.y + this.hitboxHeight/2;
        
        return (
            x >= hitboxLeft &&
            x <= hitboxRight &&
            y >= hitboxTop &&
            y <= hitboxBottom
        );
    }

    update(sun) {
        if (!this.paused) {
            if (this.autoTracking && !this.manualControl) {
                // 自動模式下的移動邏輯
                this.targetAngle += this.rotationSpeed * this.autoDirection;
                
                // 檢查是否到達極限角度
                if (this.targetAngle >= this.maxAngle) {
                    this.targetAngle = this.maxAngle;
                    this.autoDirection = -1;  // 改為逆時針
                } else if (this.targetAngle <= this.minAngle) {
                    this.targetAngle = this.minAngle;
                    this.autoDirection = 1;   // 改為順時針
                }
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
                const dx = sunPos.x - this.x;
                const dy = sunPos.y - this.y;
                const sunAngle = (Math.atan2(-dy, dx) * 180 / Math.PI);
                const normalAngle = this.angle + 90;
                
                let angleDiff = Math.abs(sunAngle - normalAngle);
                while (angleDiff > 180) {
                    angleDiff = Math.abs(angleDiff - 360);
                }
                
                this.efficiency = Math.cos(angleDiff * Math.PI / 180);
                this.efficiency = Math.max(0, this.efficiency);
                this.efficiency *= sun.getLightIntensity();
            } else {
                this.efficiency = 0;
            }
            
            this.updateStatusPanel();
            
            // 更新控制面板位置
            this.controlPanelX = this.canvas.width - 220;
            this.controlPanelY = this.canvas.height - 130;
        }
    }

    draw() {
        this.ctx.save();
        
        // 繪製太陽能板
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle * Math.PI / 180);
        
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 繪製支架
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(-5, 0, 10, 50);
        
        // 如果需要，可以取消註釋以下代碼來顯示碰撞檢測區域（用於調試）
        /*
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);  // 重置變換
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        this.ctx.strokeRect(
            this.x - this.hitboxWidth/2,
            this.y - this.hitboxHeight/2,
            this.hitboxWidth,
            this.hitboxHeight
        );
        */
        
        this.ctx.restore();

        // 繪製控制面板（如果啟用）
        if (this.showControlPanel) {
            this.drawControlPanel();
        }

        // 繪製操作說明
        this.drawInstructions();
    }

    drawInstructions() {
        this.ctx.save();
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        
        const instructions = [
            '操作說明：',
            '← → : 調整太陽能板角度',
            '↑ ↓ : 調整轉動速度',
            'A 鍵: 切換自動/手動模式',
            'Space: 暫停/繼續'
        ];
        
        const startX = this.canvas.width - 180;
        const startY = 30;
        const lineHeight = 20;
        
        instructions.forEach((text, index) => {
            this.ctx.fillText(text, startX, startY + index * lineHeight);
        });
        
        this.ctx.restore();
    }

    drawControlPanel() {
        this.ctx.save();
        
        // 繪製面板背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(this.controlPanelX, this.controlPanelY, 200, 120);
        this.ctx.strokeRect(this.controlPanelX, this.controlPanelY, 200, 120);

        // 繪製標題
        this.ctx.fillStyle = '#333';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('控制面板', this.controlPanelX + 10, this.controlPanelY + 25);

        // 繪製旋轉速度
        this.ctx.fillText(`旋轉速度: ${this.rotationSpeed.toFixed(2)}`, 
            this.controlPanelX + 10, this.controlPanelY + 50);

        // 繪製自動模式狀態和方向
        const directionText = this.autoDirection > 0 ? '順時針' : '逆時針';
        this.ctx.fillText(`自動追蹤: ${this.autoTracking ? directionText : '關閉'}`, 
            this.controlPanelX + 10, this.controlPanelY + 75);

        // 繪製當前角度
        this.ctx.fillText(`當前角度: ${Math.round(this.angle)}°`, 
            this.controlPanelX + 10, this.controlPanelY + 100);

        this.ctx.restore();
    }

    updateStatusPanel() {
        const statusPanel = document.getElementById('panel-status');
        const efficiencyPanel = document.getElementById('efficiency');
        if (statusPanel) {
            statusPanel.textContent = `太陽能板角度: ${Math.round(this.angle)}° | 旋轉速度: ${this.rotationSpeed.toFixed(2)} | ${this.autoTracking ? (this.autoDirection > 0 ? '順時針' : '逆時針') : '手動'}模式`;
        }
        if (efficiencyPanel) {
            efficiencyPanel.textContent = `發電效率: ${(this.efficiency * 100).toFixed(1)}%`;
        }
    }

    getEfficiency() {
        return parseFloat((this.efficiency * 100).toFixed(1));
    }

    isGenerating() {
        return this.efficiency > 0;
    }

    toggleAutoTracking() {
        this.autoTracking = !this.autoTracking;
        if (this.autoTracking) {
            this.autoDirection = 1;  // 重置方向為順時針
        }
        this.updateStatusPanel();
    }
}
