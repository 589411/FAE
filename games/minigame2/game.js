const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 設置畫布大小適配螢幕
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 遊戲變數
let score = 0;
let timeLeft = 5; // 遊戲時間（秒）
let colorSequence = [];
let gameRunning = false;
let intervalId;

// 隨機生成顏色序列
function generateColorSequence(length) {
  const colors = ["#FF3B30", "#38D644", "#FDBA1E"];
  colorSequence = [];
  for (let i = 0; i < length; i++) {
    colorSequence.push(colors[Math.floor(Math.random() * 3)]);
  }
}

// 畫出當前顏色，並延遲切換到下一個顏色
function drawColor(index) {
  if (index >= colorSequence.length) return;
  const color = colorSequence[index];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 延遲 1 秒後切換到下一個顏色
  setTimeout(() => drawColor(index + 1), 1000);
}

// 更新遊戲資訊（時間與分數）
function drawGameInfo() {
  ctx.fillStyle = "#FFF";
  ctx.font = "24px Arial";
  ctx.fillText(`時間：${timeLeft.toFixed(1)} 秒`, 10, 30);
  ctx.fillText(`得分：${score}`, 10, 60);
}

// 開始遊戲
function startGame() {
  gameRunning = true;
  timeLeft = 5;
  score = 0;
  generateColorSequence(4); // 初始序列長度為4
  drawColor(0);
}

// 遊戲循環
function gameLoop() {
  if (!gameRunning) return;

  // 檢查時間
  if (timeLeft <= 0) {
    endGame("時間到！");
    return;
  }

  // 更新時間
  timeLeft -= 0.016; // 每幀約 16ms

  // 繪製遊戲資訊（不清除顏色）
  drawGameInfo();

  requestAnimationFrame(gameLoop);
}

// 結束遊戲
function endGame(message) {
  clearInterval(intervalId);
  gameRunning = false;
  alert(`遊戲結束！${message}\n總得分：${score}`);
}

// 遊戲開始
document.addEventListener("click", () => {
  if (!gameRunning) {
    startGame();
    gameLoop(); // 確認 gameLoop 是否正確執行
  }
});
