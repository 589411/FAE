class SpaceGame {
    constructor() {
        this.player = document.getElementById('player');
        this.gameArea = document.querySelector('.game-area');
        this.blueCountElement = document.getElementById('blueCount');
        this.healthElement = document.getElementById('health');
        this.startButton = document.getElementById('startGame');
        this.blueCount = 0;
        this.health = 100;
        this.gameActive = false;
        this.playerX = 375;
        this.playerY = 430;
        this.objects = [];
        this.keys = {};
        this.spawnRate = 1500;
        this.redProbability = 0.7;
        this.moveSpeed = 7;

        this.init();
    }

    init() {
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
        this.blueCount = 0;
        this.health = 100;
        this.blueCountElement.textContent = this.blueCount;
        this.healthElement.textContent = this.health;
        this.startButton.style.display = 'none';
        
        this.gameLoop();
        this.spawnObjects();
    }

    handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
        }
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    movePlayer() {
        if (this.keys['ArrowLeft'] && this.playerX > 0) {
            this.playerX -= this.moveSpeed;
        }
        if (this.keys['ArrowRight'] && this.playerX < 750) {
            this.playerX += this.moveSpeed;
        }
        
        this.player.style.left = `${this.playerX}px`;
    }

    spawnObjects() {
        if (!this.gameActive) return;

        const object = document.createElement('div');
        object.style.position = 'absolute';
        object.style.width = '30px';
        object.style.height = '30px';
        object.style.borderRadius = '50%';
        object.style.left = `${Math.random() * 770}px`;
        object.style.top = '-30px';
        
        const isRed = Math.random() < this.redProbability;
        if (isRed) {
            object.classList.add('red-asteroid');
        } else {
            object.classList.add('blue-crystal');
        }
        
        this.gameArea.appendChild(object);
        this.objects.push({
            element: object,
            x: parseFloat(object.style.left),
            y: -30,
            speed: isRed ? (3 + Math.random() * 2) : (2 + Math.random()),
            isRed: isRed
        });

        this.spawnRate = Math.max(800, this.spawnRate - 10);
        this.redProbability = Math.min(0.8, this.redProbability + 0.001);

        setTimeout(() => this.spawnObjects(), this.spawnRate);
    }

    moveObjects() {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const object = this.objects[i];
            object.y += object.speed;
            object.element.style.top = `${object.y}px`;

            if (this.checkCollision(object)) {
                this.gameArea.removeChild(object.element);
                this.objects.splice(i, 1);
                
                if (object.isRed) {
                    this.health -= 20;
                    this.healthElement.textContent = this.health;
                    this.gameArea.classList.add('damage');
                    setTimeout(() => this.gameArea.classList.remove('damage'), 200);
                    
                    if (this.health <= 0) {
                        this.endGame(false);
                        return;
                    }
                } else {
                    this.blueCount++;
                    this.blueCountElement.textContent = this.blueCount;
                    if (this.blueCount >= 10) {
                        this.endGame(true);
                        return;
                    }
                }
                continue;
            }

            if (object.y > 500) {
                this.gameArea.removeChild(object.element);
                this.objects.splice(i, 1);
            }
        }
    }

    checkCollision(object) {
        const playerRect = this.player.getBoundingClientRect();
        const objectRect = object.element.getBoundingClientRect();

        return !(playerRect.right < objectRect.left || 
                playerRect.left > objectRect.right || 
                playerRect.bottom < objectRect.top || 
                playerRect.top > objectRect.bottom);
    }

    endGame(success) {
        this.gameActive = false;
        this.startButton.style.display = 'block';
        
        if (success) {
            localStorage.setItem('gameCompleted', 'true');
            alert('恭喜！你已成功收集足夠的研究數據！');
            window.location.href = 'final.html';
        } else {
            alert('任務失敗！太空船受損過重！');
        }
        
        this.objects.forEach(object => {
            this.gameArea.removeChild(object.element);
        });
        this.objects = [];
    }

    gameLoop() {
        if (!this.gameActive) return;

        this.movePlayer();
        this.moveObjects();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => {
    new SpaceGame();
};
