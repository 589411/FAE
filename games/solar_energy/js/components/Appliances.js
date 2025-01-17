class Appliances {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 設備位置
        this.x = canvas.width * 3/4;  // 放在畫面右側
        this.y = canvas.height - 150;
        
        // 燈泡屬性（從上到下排序）
        this.lightBulbs = [
            {
                x: this.x - 80,
                y: this.y - 100,
                radius: 15,
                isOn: false,
                brightness: 0,
                power: 2.0,  // 每秒耗電量（百分比）
                priority: 2  // 優先級（越高越晚開啟，越早關閉）
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
                priority: 0  // 最低優先級（最早開啟，最晚關閉）
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
                priority: 2
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
                priority: 0
            }
        ];
    }

    update(battery, deltaTime) {
        const batteryLevel = battery.getLevel();
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

        // 更新所有燈泡（按優先級排序：由下到上開啟，由上到下關閉）
        const sortedBulbs = [...this.lightBulbs].sort((a, b) => {
            if (activeBulbs === 0) {
                // 關閉時：優先級高的先關
                return b.priority - a.priority;
            } else {
                // 開啟時：優先級低的先開
                return a.priority - b.priority;
            }
        });

        for (let i = 0; i < sortedBulbs.length; i++) {
            const bulb = sortedBulbs[i];
            if (i < activeBulbs) {
                bulb.isOn = true;
                bulb.brightness = Math.min(1, bulb.brightness + 0.1);
                battery.discharge(bulb.power * deltaSeconds);
            } else {
                bulb.isOn = false;
                bulb.brightness = Math.max(0, bulb.brightness - 0.1);
            }
        }
        
        // 更新所有風扇（按優先級排序：由下到上開啟，由上到下關閉）
        const sortedFans = [...this.fans].sort((a, b) => {
            if (activeFans === 0) {
                // 關閉時：優先級高的先關
                return b.priority - a.priority;
            } else {
                // 開啟時：優先級低的先開
                return a.priority - b.priority;
            }
        });

        for (let i = 0; i < sortedFans.length; i++) {
            const fan = sortedFans[i];
            if (i < activeFans) {
                fan.isOn = true;
                fan.speed = Math.min(1, fan.speed + 0.1);
                fan.rotation = (fan.rotation + fan.speed * 10) % 360;
                battery.discharge(fan.power * deltaSeconds);
            } else {
                fan.isOn = false;
                fan.speed = Math.max(0, fan.speed - 0.1);
                fan.rotation = (fan.rotation + fan.speed * 10) % 360;
            }
        }
        
        this.updateStatusPanel(batteryLevel, activeBulbs, activeFans);
    }

    updateStatusPanel(batteryLevel, activeBulbs, activeFans) {
        const appliancesStatus = document.getElementById('appliances-status');
        if (appliancesStatus) {
            const totalPower = this.getTotalPowerConsumption();
            appliancesStatus.textContent = `耗電量: ${totalPower.toFixed(1)}%/秒 | 運作中: ${activeBulbs}燈泡 ${activeFans}風扇`;
        }
    }

    draw() {
        // 繪製所有燈泡
        for (let bulb of this.lightBulbs) {
            this.drawLightBulb(bulb);
        }
        
        // 繪製所有風扇
        for (let fan of this.fans) {
            this.drawFan(fan);
        }
    }

    drawLightBulb(bulb) {
        this.ctx.save();
        
        // 繪製燈泡底座
        this.ctx.beginPath();
        this.ctx.moveTo(bulb.x, bulb.y + bulb.radius);
        this.ctx.lineTo(bulb.x, bulb.y + bulb.radius + 10);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 繪製燈泡
        this.ctx.beginPath();
        this.ctx.arc(bulb.x, bulb.y, bulb.radius, 0, Math.PI * 2);
        
        // 根據亮度設置顏色
        const brightness = Math.floor(bulb.brightness * 255);
        this.ctx.fillStyle = `rgb(255, ${255 - brightness/2}, ${100 - brightness/2})`;
        this.ctx.fill();
        
        // 發光效果
        if (bulb.brightness > 0) {
            this.ctx.beginPath();
            this.ctx.arc(bulb.x, bulb.y, 
                bulb.radius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${bulb.brightness * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawFan(fan) {
        this.ctx.save();
        
        // 移動到風扇中心並旋轉
        this.ctx.translate(fan.x, fan.y);
        this.ctx.rotate(fan.rotation * Math.PI / 180);
        
        // 繪製扇葉
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(fan.radius * Math.cos(i * Math.PI * 2/3),
                          fan.radius * Math.sin(i * Math.PI * 2/3));
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // 繪製中心圓
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
        
        this.ctx.restore();
        
        // 繪製底座
        this.ctx.beginPath();
        this.ctx.moveTo(fan.x, fan.y + 5);
        this.ctx.lineTo(fan.x, fan.y + 15);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    getTotalPowerConsumption() {
        let totalPower = 0;
        // 計算所有燈泡的耗電量
        for (let bulb of this.lightBulbs) {
            if (bulb.isOn) totalPower += bulb.power;
        }
        // 計算所有風扇的耗電量
        for (let fan of this.fans) {
            if (fan.isOn) totalPower += fan.power;
        }
        return totalPower;
    }
}
