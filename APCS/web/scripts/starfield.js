// 3D 星空背景效果
class StarField {
    constructor() {
        this.canvas = document.getElementById('starfield');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.numStars = 200;
        this.speed = 0.5;
        
        this.init();
        this.animate();
        
        // 響應視窗大小變化
        window.addEventListener('resize', () => this.init());
    }
    
    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * this.canvas.width,
                size: Math.random() * 2,
                brightness: Math.random()
            });
        }
    }
    
    update() {
        for (let star of this.stars) {
            star.z -= this.speed;
            
            if (star.z <= 0) {
                star.z = this.canvas.width;
                star.x = Math.random() * this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        }
    }
    
    draw() {
        // 清空畫布
        this.ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製星星
        for (let star of this.stars) {
            const x = (star.x - this.canvas.width / 2) * (this.canvas.width / star.z);
            const y = (star.y - this.canvas.height / 2) * (this.canvas.width / star.z);
            const size = star.size * (this.canvas.width / star.z);
            
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            const screenX = x + centerX;
            const screenY = y + centerY;
            
            if (screenX < 0 || screenX > this.canvas.width || 
                screenY < 0 || screenY > this.canvas.height) {
                continue;
            }
            
            // 星星顏色和亮度
            const brightness = Math.min(1, (this.canvas.width - star.z) / this.canvas.width);
            const alpha = brightness * star.brightness;
            
            // 隨機顏色（白色、藍色、青色）
            const colors = [
                `rgba(232, 244, 248, ${alpha})`, // 白色
                `rgba(0, 217, 255, ${alpha})`,   // 青色
                `rgba(168, 85, 247, ${alpha})`   // 紫色
            ];
            
            const colorIndex = Math.floor(star.brightness * colors.length);
            this.ctx.fillStyle = colors[colorIndex];
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加發光效果
            if (size > 1) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = colors[colorIndex];
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化星空
document.addEventListener('DOMContentLoaded', () => {
    new StarField();
});
