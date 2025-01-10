// 步驟控制
function showNextStep(stepNumber) {
    // 隱藏所有步驟
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // 顯示目標步驟
    document.getElementById('step' + stepNumber).classList.add('active');
}

// 初始化函數
function initializeGame() {
    // 在這裡添加遊戲初始化邏輯
}

// 評估函數
function evaluateProgress() {
    // 在這裡添加評估邏輯
}

// 頁面加載完成後執行
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});
