"use strict";

class SpaceGame {
  constructor() {
    // Cache DOM elements
    this.player = document.getElementById("player");
    this.gameArea = document.querySelector(".game-area");
    this.blueCountElement = document.getElementById("blueCount");
    this.healthElement = document.getElementById("health");
    this.startButton = document.getElementById("startGame");

    // Initialize game state
    this.blueCount = 0;
    this.health = 100;
    this.isGameActive = false;

    // Player position
    this.playerX = 375;
    this.playerY = 430;

    // All falling objects in the game
    this.objects = [];

    // Input control
    this.keys = {};

    // Difficulty and spawn parameters
    this.spawnInterval = 1500;    // Interval in milliseconds at which asteroids/crystals appear
    this.redProbability = 0.7;    // Probability of generating a red asteroid
    this.minSpawnInterval = 800;  // Minimum spawn interval to stop it from getting too hard
    this.spawnIntervalReduction = 10;   // By how many ms to reduce spawnInterval each time
    this.probabilityIncrease = 0.001;    // Amount to increase redProbability each spawn

    // Movement constants
    this.playerMoveSpeed = 5;
    this.playerMinX = 0;
    this.playerMaxX = 750; // 800px wide minus 50px (player width?), adjust if necessary

    // Called once
    this.init();
  }

  // ------------------------------------------------
  // Initialization
  // ------------------------------------------------
  init() {
    // If the user didn't pass the password puzzle, redirect
    if (!localStorage.getItem("passwordCompleted")) {
      window.location.href = "question.html";
      return;
    }

    // Attach event listeners
    this.startButton.addEventListener("click", () => this.startGame());
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));
  }

  // ------------------------------------------------
  // Start the Game
  // ------------------------------------------------
  startGame() {
    // Avoid restarting if already running
    if (this.isGameActive) return;

    this.isGameActive = true;
    this.blueCount = 0;
    this.health = 100;

    // Update UI
    this.blueCountElement.textContent = this.blueCount;
    this.healthElement.textContent = this.health;
    this.startButton.disabled = true; // prevent repeated clicks

    // Kick off loops
    this.gameLoop();     // Movement & collisions
    this.spawnObjects(); // Start spawning crystals/asteroids
  }

  // ------------------------------------------------
  // Input Handling
  // ------------------------------------------------
  handleKeyDown(event) {
    this.keys[event.key] = true;
  }

  handleKeyUp(event) {
    this.keys[event.key] = false;
  }

  // ------------------------------------------------
  // Player Movement
  // ------------------------------------------------
  movePlayer() {
    if (this.keys["ArrowLeft"] && this.playerX > this.playerMinX) {
      this.playerX -= this.playerMoveSpeed;
    }
    if (this.keys["ArrowRight"] && this.playerX < this.playerMaxX) {
      this.playerX += this.playerMoveSpeed;
    }

    // Apply final position to DOM element
    this.player.style.left = `${this.playerX}px`;
    // Hard-coded bottom? If the game area changes, adapt accordingly
    this.player.style.bottom = "20px";
  }

  // ------------------------------------------------
  // Spawn Falling Objects
  // ------------------------------------------------
  spawnObjects() {
    // If game ended mid-timer
    if (!this.isGameActive) return;

    // Create & style a new object
    const object = document.createElement("div");
    object.style.position = "absolute";
    object.style.width = "30px";
    object.style.height = "30px";
    object.style.borderRadius = "50%";
    object.style.left = `${Math.random() * 770}px`;  // or 770 if area is 800 wide?
    object.style.top = "-30px";

    // Decide whether it's red or blue
    const isRed = Math.random() < this.redProbability;
    if (isRed) {
      object.classList.add("red-asteroid");
    } else {
      object.classList.add("blue-crystal");
    }

    this.gameArea.appendChild(object);

    // Store the object in our array
    this.objects.push({
      element: object,
      x: parseFloat(object.style.left),
      y: -30,
      speed: isRed ? 2 + Math.random() * 2 : 1.5 + Math.random(),
      isRed: isRed
    });

    // Adjust difficulty over time
    this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval - this.spawnIntervalReduction);
    this.redProbability = Math.min(0.8, this.redProbability + this.probabilityIncrease);

    // Schedule the next spawn
    setTimeout(() => this.spawnObjects(), this.spawnInterval);
  }

  // ------------------------------------------------
  // Move & Collisions
  // ------------------------------------------------
  moveObjects() {
    // Iterate in reverse so we can safely remove them
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];

      // Move object downward
      obj.y += obj.speed;
      obj.element.style.top = `${obj.y}px`;

      // Collision check
      if (this.detectCollision(obj)) {
        // Remove it from DOM & from array
        this.gameArea.removeChild(obj.element);
        this.objects.splice(i, 1);

        // Handle effect
        if (obj.isRed) {
          // Red asteroid => damage
          this.health -= 20;
          this.healthElement.textContent = this.health;
          if (this.health <= 0) {
            this.endGame(false);
            return;
          }
        } else {
          // Blue crystal => increment count
          this.blueCount++;
          this.blueCountElement.textContent = this.blueCount;
          if (this.blueCount >= 10) {
            this.endGame(true);
            return;
          }
        }
        continue;
      }

      // If it falls out of the game area (past height of 500?), remove
      if (obj.y > 500) {
        this.gameArea.removeChild(obj.element);
        this.objects.splice(i, 1);
      }
    }
  }

  detectCollision(object) {
    const playerRect = this.player.getBoundingClientRect();
    const objectRect = object.element.getBoundingClientRect();

    // Check bounding boxes for overlap
    return !(
      playerRect.right < objectRect.left ||
      playerRect.left > objectRect.right ||
      playerRect.bottom < objectRect.top ||
      playerRect.top > objectRect.bottom
    );
  }

  // ------------------------------------------------
  // End the Game
  // ------------------------------------------------
  endGame(success) {
    this.isGameActive = false;
    this.startButton.disabled = false;

    // Clear objects from the screen
    for (const obj of this.objects) {
      this.gameArea.removeChild(obj.element);
    }
    this.objects = [];

    if (success) {
      localStorage.setItem("gameCompleted", "true");
      alert("恭喜！你已成功收集足夠的研究數據！");
      window.location.href = "final.html";
    } else {
      alert("任務失敗！太空船受損過重！");
    }
  }

  // ------------------------------------------------
  // Main Game Loop
  // ------------------------------------------------
  gameLoop() {
    if (!this.isGameActive) return;

    // Step 1: Move player
    this.movePlayer();

    // Step 2: Move objects & handle collisions
    this.moveObjects();

    // Step 3: Schedule the next frame
    requestAnimationFrame(() => this.gameLoop());
  }
}

// ----------------------------------------------------
// On Window Load
// ----------------------------------------------------
window.onload = () => {
  new SpaceGame();
};
