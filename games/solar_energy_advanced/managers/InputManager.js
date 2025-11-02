class InputManager {
    constructor() {
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            KeyA: false
        };
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
            }
        });
    }
    
    handleInput(gameObjects) {
        // 處理太陽能板控制
        if (this.keys.ArrowLeft) {
            gameObjects.solarPanel.rotateLeft();
        }
        if (this.keys.ArrowRight) {
            gameObjects.solarPanel.rotateRight();
        }
        if (this.keys.KeyA) {
            gameObjects.solarPanel.toggleTracking();
            this.keys.KeyA = false;  // 重置按鍵狀態
        }
    }
}
