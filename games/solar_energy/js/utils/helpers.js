// 角度和弧度轉換
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// 限制數值在指定範圍內
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 計算兩點之間的距離
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// 線性插值
function lerp(start, end, t) {
    return start + (end - start) * t;
}
