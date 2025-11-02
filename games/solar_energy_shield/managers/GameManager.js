class GameManager {
    constructor() {
        this.solarPanel = new SolarPanel();
        this.battery = new Battery();
        this.building = new Building();
        this.sun = new Sun();
    }
    
    update() {
        // 更新太陽位置
        this.sun.update();
        
        // 更新太陽能板
        this.solarPanel.update(this.sun);
        
        // 如果太陽能板在發電，給電池充電
        if (this.solarPanel.isGenerating()) {
            this.battery.charge(this.solarPanel.getEfficiency() * 0.5);
        }
        
        // 更新建築物狀態
        this.building.update(this.battery);
    }
    
    handleMouseMove(mouseX, mouseY) {
        this.solarPanel.handleMouseMove(mouseX, mouseY);
    }
    
    handleClick(mouseX, mouseY) {
        this.solarPanel.handleClick(mouseX, mouseY);
    }
    
    getGameObjects() {
        return [this.sun, this.solarPanel, this.battery, this.building];
    }
}
