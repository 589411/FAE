document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new GameManager(canvas);
    game.start();
    
    // 顯示操作說明
    console.log('操作說明：');
    console.log('- 左右方向鍵：手動控制太陽能板角度');
    console.log('- A 鍵：切換自動/手動模式');
});
