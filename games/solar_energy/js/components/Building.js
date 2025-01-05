class Building {
    constructor() {
        this.x = 580;
        this.y = 300;
        this.width = 100;
        this.height = 200;
        this.isLightOn = false;
        this.powerConsumption = 0.05;  // 每幀消耗的電量
    }
    
    update(battery) {
        if (battery.getLevel() > 0) {
            this.isLightOn = true;
            battery.discharge(this.powerConsumption);
        } else {
            this.isLightOn = false;
        }
    }
    
    draw(ctx) {
        // 繪製建築物主體
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 繪製窗戶
        const windowColor = this.isLightOn ? '#ffff00' : '#333333';
        ctx.fillStyle = windowColor;
        
        // 繪製三排窗戶
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
                ctx.fillRect(
                    this.x + 20 + (col * 40),
                    this.y + 30 + (row * 60),
                    20,
                    40
                );
            }
        }
    }
    
    getStatus() {
        return this.isLightOn ? "開啟" : "關閉";
    }
}
