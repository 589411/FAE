const Utils = {
    // 角度轉弧度
    toRadians: function(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // 弧度轉角度
    toDegrees: function(radians) {
        return radians * 180 / Math.PI;
    },
    
    // 計算兩點之間的角度（度）
    calculateAngle: function(x1, y1, x2, y2) {
        return this.toDegrees(Math.atan2(y2 - y1, x2 - x1));
    },
    
    // 確保角度在指定範圍內
    clampAngle: function(angle, min, max) {
        return Math.max(min, Math.min(max, angle));
    },
    
    // 計算兩個角度之間的最小差異（考慮360度循環）
    getAngleDifference: function(angle1, angle2) {
        let diff = Math.abs(angle1 - angle2);
        return diff > 180 ? 360 - diff : diff;
    },
    
    // 在指定範圍內生成隨機數
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // 線性插值
    lerp: function(start, end, t) {
        return start + (end - start) * t;
    }
};
