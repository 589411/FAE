const CONFIG = {
    // Canvas 設置
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        BACKGROUND_COLOR: '#87CEEB'
    },
    
    // 太陽設置
    SUN: {
        RADIUS: 30,
        COLOR: '#FFD700',
        ORBIT_RADIUS: 250,
        SPEED: 0.1
    },
    
    // 太陽能板設置
    SOLAR_PANEL: {
        WIDTH: 100,
        HEIGHT: 10,
        COLOR: '#1a75ff',
        SUPPORT_COLOR: '#666',
        MAX_ANGLE: 90,
        ROTATION_SPEED: 1,
        TRACKING_SPEED: 1,
        EFFICIENCY_ANGLE: 30  // 有效角度範圍（度）
    },
    
    // 電池設置
    BATTERY: {
        WIDTH: 300,
        HEIGHT: 150,
        COLOR: '#333',
        TERMINAL_COLOR: '#666',
        MAX_CAPACITY: 100
    },
    
    // 電子設置
    ELECTRON: {
        RADIUS: 3,
        COUNT: 20,
        COLORS: {
            WAITING: '#00ff00',
            CHARGING: '#ffff00',
            WORKING: '#ff0000',
            RETURNING: '#0000ff'
        },
        BASE_SPEED: 2,
        RECOVERY_TIME: 30
    },
    
    // 建築物設置
    BUILDING: {
        WIDTH: 100,
        HEIGHT: 200,
        COLOR: '#808080'
    },
    
    // 遊戲邏輯設置
    GAME: {
        MIN_BATTERY_LEVEL_FOR_WORK: 30,
        WORK_PROBABILITY: 0.05
    }
};
