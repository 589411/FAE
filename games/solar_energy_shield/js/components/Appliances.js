class Appliances {
    constructor(canvas, battery) {  
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.battery = battery;  
        
        // 設備位置
        this.x = canvas.width * 3/4;  
        this.y = canvas.height - 150;
        
        // 燈泡屬性（從上到下排序）
        this.lightBulbs = [
            {
                x: this.x - 80,
                y: this.y - 100,
                radius: 15,
                isOn: false,
                brightness: 0,
                power: 2.0,  
                priority: 0  // 最高優先級（最早開啟，最晚關閉）
            },
            {
                x: this.x - 80,
                y: this.y - 50,
                radius: 15,
                isOn: false,
                brightness: 0,
                power: 2.0,
                priority: 1
            },
            {
                x: this.x - 80,
                y: this.y,
                radius: 15,
                isOn: false,
                brightness: 0,
                power: 2.0,
                priority: 2  // 最低優先級（最晚開啟，最早關閉）
            }
        ];
        
        // 風扇屬性（從上到下排序）
        this.fans = [
            {
                x: this.x + 50,
                y: this.y - 100,
                radius: 20,
                isOn: false,
                speed: 0,
                rotation: 0,
                power: 3.0,
                priority: 0  // 最高優先級
            },
            {
                x: this.x + 50,
                y: this.y - 50,
                radius: 20,
                isOn: false,
                speed: 0,
                rotation: 0,
                power: 3.0,
                priority: 1
            },
            {
                x: this.x + 50,
                y: this.y,
                radius: 20,
                isOn: false,
                speed: 0,
                rotation: 0,
                power: 3.0,
                priority: 2  // 最低優先級
            }
        ];
    }

    update(deltaTime) {  
        const batteryLevel = this.battery.getLevel();
        const deltaSeconds = deltaTime / 1000;
        
        // 根據電池電量決定運作的電器數量
        let activeBulbs = 0;
        let activeFans = 0;
        
        if (batteryLevel > 80) {
            activeBulbs = 3;
            activeFans = 3;
        } else if (batteryLevel > 50) {
            activeBulbs = 2;
            activeFans = 2;
        } else if (batteryLevel > 20) {
            activeBulbs = 1;
            activeFans = 1;
        }

        let totalPower = 0;  // 計算總耗電量

        // 更新燈泡狀態
        const sortedBulbs = [...this.lightBulbs].sort((a, b) => {
            // 當開啟時（activeBulbs增加），從下到上啟動
            // 當關閉時（activeBulbs減少），從上到下關閉
            if (activeBulbs > this.lightBulbs.filter(b => b.isOn).length) {
                return a.priority - b.priority; // 從下到上啟動
            } else {
                return b.priority - a.priority; // 從上到下關閉
            }
        });
        sortedBulbs.forEach((bulb, index) => {
            if (index < activeBulbs) {
                bulb.isOn = true;
                bulb.brightness = Math.min(1, bulb.brightness + deltaSeconds * 2);
                totalPower += bulb.power;  // 每秒固定耗電量
            } else {
                bulb.isOn = false;
                bulb.brightness = Math.max(0, bulb.brightness - deltaSeconds * 2);
            }
        });

        // 更新風扇狀態
        const sortedFans = [...this.fans].sort((a, b) => {
            // 當開啟時（activeFans增加），從下到上啟動
            // 當關閉時（activeFans減少），從上到下關閉
            if (activeFans > this.fans.filter(f => f.isOn).length) {
                return a.priority - b.priority; // 從下到上啟動
            } else {
                return b.priority - a.priority; // 從上到下關閉
            }
        });
        sortedFans.forEach((fan, index) => {
            if (index < activeFans) {
                fan.isOn = true;
                fan.speed = Math.min(1, fan.speed + deltaSeconds);
                fan.rotation += fan.speed * 360 * deltaSeconds;
                totalPower += fan.power;  // 每秒固定耗電量
            } else {
                fan.isOn = false;
                fan.speed = Math.max(0, fan.speed - deltaSeconds);
                fan.rotation += fan.speed * 360 * deltaSeconds;
            }
        });

        // 更新電池電量（每秒消耗固定電量）
        if (totalPower > 0) {
            this.battery.discharge(totalPower * deltaSeconds);
        }

        // 更新狀態面板
        const appliancesStatus = document.getElementById('appliances-status');
        if (appliancesStatus) {
            appliancesStatus.textContent = `耗電量: ${totalPower.toFixed(1)}W`;
        }
    }

    draw() {
        this.ctx.save();
        
        // 繪製燈泡
        this.lightBulbs.forEach(bulb => {
            // 繪製燈泡外殼
            this.ctx.beginPath();
            this.ctx.arc(bulb.x, bulb.y, bulb.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = bulb.isOn ? 
                `rgba(255, 255, 0, ${bulb.brightness})` : 
                'rgba(200, 200, 200, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 繪製燈泡底座
            this.ctx.fillStyle = '#666';
            this.ctx.fillRect(bulb.x - 5, bulb.y + bulb.radius, 10, 10);
            
            // 如果燈泡開啟，繪製光暈效果
            if (bulb.brightness > 0) {
                const gradient = this.ctx.createRadialGradient(
                    bulb.x, bulb.y, bulb.radius,
                    bulb.x, bulb.y, bulb.radius * 2
                );
                gradient.addColorStop(0, `rgba(255, 255, 200, ${0.3 * bulb.brightness})`);
                gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(bulb.x, bulb.y, bulb.radius * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // 繪製風扇
        this.fans.forEach(fan => {
            // 繪製風扇中心
            this.ctx.beginPath();
            this.ctx.arc(fan.x, fan.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#333';
            this.ctx.fill();
            
            // 繪製扇葉
            this.ctx.save();
            this.ctx.translate(fan.x, fan.y);
            this.ctx.rotate(fan.rotation * Math.PI / 180);
            
            for (let i = 0; i < 3; i++) {
                this.ctx.save();
                this.ctx.rotate(i * 120 * Math.PI / 180);
                
                // 扇葉顏色根據運轉狀態變化
                this.ctx.fillStyle = fan.isOn ? 
                    `rgba(100, 100, 100, ${0.5 + 0.5 * fan.speed})` : 
                    'rgba(200, 200, 200, 0.5)';
                
                // 繪製扇葉
                this.ctx.beginPath();
                this.ctx.moveTo(0, -3);
                this.ctx.lineTo(fan.radius, -8);
                this.ctx.lineTo(fan.radius, 8);
                this.ctx.lineTo(0, 3);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }
}
