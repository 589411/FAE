class RenderManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }
    
    render(gameObjects) {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 繪製遊戲對象
        for (let obj of gameObjects) {
            if (obj.draw) {
                obj.draw(this.ctx);
            }
        }
        
        // 更新狀態面板
        this.updateStatusPanel(gameObjects);
    }
    
    updateStatusPanel(gameObjects) {
        const battery = gameObjects.find(obj => obj instanceof Battery);
        const solarPanel = gameObjects.find(obj => obj instanceof SolarPanel);
        const building = gameObjects.find(obj => obj instanceof Building);
        
        if (!battery || !solarPanel || !building) return;
        
        // 更新HTML元素
        document.getElementById('mode').textContent = 
            `模式：${solarPanel.getMode()}`;
        document.getElementById('efficiency').textContent = 
            `發電效率：${Math.round(solarPanel.getEfficiency() * 100)}%`;
        document.getElementById('battery').textContent = 
            `電池電量：${Math.round(battery.getLevel())}%`;
        document.getElementById('generation').textContent = 
            `發電狀態：${solarPanel.isGenerating() ? '發電中' : '未發電'}`;
        document.getElementById('light').textContent = 
            `燈：${building.isLightOn ? '開啟' : '關閉'}`;
    }
}
