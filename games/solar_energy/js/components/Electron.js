class Electron {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.state = 'waiting';
        this.isRightSide = false;
        this.recoveryTime = 0;
        this.maxRecoveryTime = CONFIG.ELECTRON.RECOVERY_TIME;
        this.speed = CONFIG.ELECTRON.BASE_SPEED;
        this.chargingProgress = 0;
        this.workPath = 0;
    }
    
    update(generatingEfficiency, batteryTerminals) {
        switch(this.state) {
            case 'waiting':
                this.recoveryTime++;
                break;
                
            case 'charging':
                this.chargingProgress += this.speed;
                this.x = batteryTerminals.left.x + this.chargingProgress;
                if (this.x >= batteryTerminals.right.x) {
                    this.state = 'waiting';
                    this.isRightSide = true;
                    this.recoveryTime = 0;
                    this.x = batteryTerminals.right.x;
                }
                break;
                
            case 'working':
                this.workPath += this.speed;
                if (this.workPath >= 100) {
                    this.state = 'returning';
                }
                break;
                
            case 'returning':
                this.x -= this.speed;
                if (this.x <= batteryTerminals.left.x) {
                    this.state = 'waiting';
                    this.isRightSide = false;
                    this.recoveryTime = 0;
                    this.x = batteryTerminals.left.x;
                }
                break;
        }
    }
    
    startCharging(efficiency) {
        if (this.state === 'waiting' && !this.isRightSide && 
            this.recoveryTime >= this.maxRecoveryTime) {
            this.state = 'charging';
            this.chargingProgress = 0;
            this.speed = CONFIG.ELECTRON.BASE_SPEED * (1 + efficiency);
            return true;
        }
        return false;
    }
    
    startWorking() {
        if (this.state === 'waiting' && this.isRightSide) {
            this.state = 'working';
            this.workPath = 0;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, CONFIG.ELECTRON.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.ELECTRON.COLORS[this.state.toUpperCase()];
        ctx.fill();
    }
    
    getState() {
        return this.state;
    }
    
    isReadyToCharge() {
        return this.state === 'waiting' && !this.isRightSide && 
            this.recoveryTime >= this.maxRecoveryTime;
    }
    
    isReadyToWork() {
        return this.state === 'waiting' && this.isRightSide;
    }
}
