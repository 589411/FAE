class SpaceGame {
    constructor() {
        this.player = document.getElementById('player');
        this.gameArea = document.querySelector('.game-area');
        this.scoreElement = document.getElementById('score');
        this.startButton = document.getElementById('startGame');
        this.score = 0;
        this.gameActive = false;
        this.playerX = 375;
        this.playerY = 430;
        this.asteroids = [];
        this.keys = {};
        this.targetScore = 300; // 需要達到的分數以完成遊戲

        this.init();
    }

    init() {
        // 檢查是否完成前一關
        if (!localStorage.getItem('passwordCompleted')) {
            window.location.href = 'question.html';
            return;
        }

        this.startButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    startGame() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.startButton.disabled = true;
        
        this.gameLoop();
        this.spawnAsteroids();
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    movePlayer() {
        if (this.keys['ArrowLeft'] && this.playerX > 0) {
            this.playerX -= 5;
        }
        if (this.keys['ArrowRight'] && this.playerX < 750) {
            this.playerX += 5;
        }
        
        this.player.style.left = `${this.playerX}px`;
        this.player.style.bottom = `${20}px`;
    }

    spawnAsteroids() {
        if (!this.gameActive) return;

        const asteroid = document.createElement('div');
        asteroid.style.position = 'absolute';
        asteroid.style.width = '30px';
        asteroid.style.height = '30px';
        asteroid.style.backgroundColor = 'red';
        asteroid.style.borderRadius = '50%';
        asteroid.style.left = `${Math.random() * 770}px`;
        asteroid.style.top = '-30px';
        
        this.gameArea.appendChild(asteroid);
        this.asteroids.push({
            element: asteroid,
            x: parseFloat(asteroid.style.left),
            y: -30,
            speed: 2 + Math.random() * 2
        });

        setTimeout(() => this.spawnAsteroids(), 2000);
    }

    moveAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.y += asteroid.speed;
            asteroid.element.style.top = `${asteroid.y}px`;

            if (this.checkCollision(asteroid)) {
                this.endGame(false);
                return;
            }

            if (asteroid.y > 500) {
                this.gameArea.removeChild(asteroid.element);
                this.asteroids.splice(i, 1);
                this.score += 10;
                this.scoreElement.textContent = this.score;

                // 檢查是否達到目標分數
                if (this.score >= this.targetScore) {
                    this.endGame(true);
                    return;
                }
            }
        }
    }

    checkCollision(asteroid) {
        const playerRect = this.player.getBoundingClientRect();
        const asteroidRect = asteroid.element.getBoundingClientRect();

        return !(playerRect.right < asteroidRect.left || 
                playerRect.left > asteroidRect.right || 
                playerRect.bottom < asteroidRect.top || 
                playerRect.top > asteroidRect.bottom);
    }

    endGame(success) {
        this.gameActive = false;
        this.startButton.disabled = false;
        
        if (success) {
            localStorage.setItem('gameCompleted', 'true');
            alert('恭喜！你已成功抵達月球！');
            window.location.href = 'final.html';
        } else {
            alert(`任務失敗！得分：${this.score}`);
        }
        
        // 清理小行星
        this.asteroids.forEach(asteroid => {
            this.gameArea.removeChild(asteroid.element);
        });
        this.asteroids = [];
    }

    gameLoop() {
        if (!this.gameActive) return;

        this.movePlayer();
        this.moveAsteroids();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 當頁面載入時開始遊戲
window.onload = () => {
    new SpaceGame();
};
