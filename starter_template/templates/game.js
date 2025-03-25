document.addEventListener("DOMContentLoaded", () => {
    class GameUI {
      constructor() {
        this.startMenuScreen = document.getElementById("start-menu-screen");
        this.settingsScreen = document.getElementById("settings-screen");
        this.instructionsScreen = document.getElementById("instructions-screen");
        this.gameScreen = document.getElementById("game-screen");
        this.gameOverScreen = document.getElementById("game-over-screen");
        this.gameControls = document.getElementById("game-controls");
        this.hud = document.getElementById("hud");

        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.timerElement = document.getElementById("timer");
        this.coinCounterElement = document.getElementById("coinCounter");
        this.fireRateDisplayElement = document.getElementById("fireRateDisplay");
        this.healthDisplayElement = document.getElementById("healthDisplay");
        this.hazardWarningElement = document.getElementById("hazardWarning");

        this.joystickContainer = document.getElementById("joystick-container");
        this.joystickHandle = document.getElementById("joystick-handle");
        this.actionButtons = document.getElementById("action-buttons");

        this.sounds = {
            turretPlacement: this.safeSound("turret-place-sound"),
            turretDeath: this.safeSound("turret-death-sound"),
            turretShoot: this.safeSound("turret-shoot-sound"),
            shipMove: this.safeSound("ship-move-sound"),
            shipShoot: this.safeSound("ship-shoot-sound"),
            shipDestroy: this.safeSound("ship-destroy-sound"),
            attackUpgrade: this.safeSound("attack-upgrade-sound"),
            enemyDeath: this.safeSound("enemy-death-sound"),
            asteroidHit: this.safeSound("asteroid-hit-sound"),
            solarFlare: this.safeSound("solar-flare-sound"),
            debris: this.safeSound("debris-sound"),
          };
        }

        safeSound(id) {
            const el = document.getElementById(id);
            return el || { play: () => Promise.resolve(), pause: () => {}, currentTime: 0 };
          }

      swapToScreen(screen) {
        this.startMenuScreen.classList.remove("active");
        this.settingsScreen.classList.remove("active");
        this.instructionsScreen.classList.remove("active");
        this.gameScreen.classList.remove("active");
        this.gameOverScreen.classList.remove("active");
        screen.classList.add("active");

        if (screen.id === "game-screen") {
          this.hud.style.display = "block";
          this.gameControls.style.display = "block";
          this.joystickContainer.style.display = "block"; // Show joystick
          this.actionButtons.style.display = "flex"; // Show buttons
          this.resizeCanvas();
        } else {
          this.hud.style.display = "none";
          this.gameControls.style.display = "none";
          this.joystickContainer.style.display = "none"; // Hide joystick
          this.actionButtons.style.display = "none"; // Hide buttons
        }
      }

      resetJoystick() {
        this.joystickHandle.style.left = "50%";
        this.joystickHandle.style.top = "50%";
      }

      resizeCanvas() {
        this.canvas.width = window.innerWidth || 800; // Default to 800 if window.innerWidth is 0
        this.canvas.height = window.innerHeight || 600; // Default to 600 if window.innerHeight is 0
      }

      startGame() {
        const backgroundMusic = document.getElementById("background-music");
        backgroundMusic.play().catch((error) => {
            console.warn("Background music failed to play, continuing game:", error); // Use warn instead of error to prevent freeze
        });
        this.swapToScreen(this.gameScreen);
      }

      endGame(backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        const gameOverMusic = document.getElementById("gameover-music");
        gameOverMusic.play().catch((error) => console.error("Error playing game over music:", error));
        this.swapToScreen(this.gameOverScreen);
      }

      mainMenu() { this.swapToScreen(this.startMenuScreen); }
      settings() { this.swapToScreen(this.settingsScreen); }
      instructions() { this.swapToScreen(this.instructionsScreen); }

      updateHUD(time, coins, fireRate, health, hazardWarning) {
        this.timerElement.textContent = `Time: ${time.toFixed(1)}`;
        this.coinCounterElement.textContent = `Coins: ${coins}`;
        this.fireRateDisplayElement.textContent = `Fire Rate: ${fireRate.toFixed(2)}`;
        this.healthDisplayElement.textContent = `Health: ${health}`;
        this.hazardWarningElement.textContent = hazardWarning || "";
      }
    }

    class GameLogic {
      constructor(ui) {
        this.ui = ui;
        this.ctx = ui.ctx;

        this.gameOver = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.lastFrameTime = 0;
        this.coinCount = 0;
        this.fireRate = 6;
        this.playerHealth = 5;

        this.player = { x: window.innerWidth / 2, y: window.innerHeight / 2, size: 60, speed: 5 };
        this.projectiles = [];
        this.enemies = [];
        this.coins = [];
        this.towers = [];
        this.asteroids = [];
        this.debris = [];
        this.solarFlare = { active: false, warningTime: 0, duration: 0 };
        this.mines = [];

        this.projectileSpeed = 10;
        this.projectileDamage = 1;
        this.enemySize = 30;
        this.enemySpeed = 1;
        this.spawnRate = 0.5;
        this.coinSize = 20;
        this.towerSize = 50;
        this.towerRange = 300;
        this.towerFireRate = 6;
        this.asteroidSize = 120;
        this.debrisSize = 5;

        this.isShooting = false;
        this.keys = { w: false, a: false, s: false, d: false };
        this.mouseX = 0;
        this.mouseY = 0;
        this.touchX = 0;
        this.touchY = 0;
        this.isTouching = false;
        this.isMoving = false;
        this.moveSoundPlaying = false;

        this.timeSinceLastSpawn = 0;
        this.timeSinceLastShot = 0;
        this.timeSinceLastHazard = 0;
        this.timeSinceLastNebulaStalker = 0; // MARK: Nebula Stalker Spawn Timer
        this.timeSinceLastZephyrScout = 0;   // MARK: Zephyr Scout Spawn Timer
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;

        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;

        this.images = {
          player: new Image(), 
          zephyrScout: new Image(), // Zephyr Scout image
          nebulaStalker: new Image(), // Nebula Stalker image
          solarCharger: new Image(), // Solar Charger image (for future use)
          fractalShard: new Image(), // Fractal Shard image (for future use)
          voidMineLayer: new Image(), // Void Mine Layer image
          coin: new Image(),
          background: new Image(), 
          tower: new Image(), 
          asteroid: new Image()
        };
        const logImageStatus = (name, img) => {
            img.onload = () => console.log(`${name} image loaded successfully`);
            img.onerror = () => console.error(`${name} image failed to load at ${img.src}`);
          };
          
        logImageStatus("player", this.images.player);
        this.images.player.src = "./assets/images/player.png";
        logImageStatus("zephyrScout", this.images.zephyrScout);
        this.images.zephyrScout.src = "./assets/images/enemy.png";
        logImageStatus("nebulaStalker", this.images.nebulaStalker);
        this.images.nebulaStalker.src = "./assets/images/nebula_stalker.png";
        logImageStatus("solarCharger", this.images.solarCharger);
        this.images.solarCharger.src = "./assets/images/solarCharger.png";
        logImageStatus("fractalShard", this.images.fractalShard);
        this.images.fractalShard.src = "./assets/images/fractalShard.png";
        logImageStatus("voidMineLayer", this.images.voidMineLayer);
        this.images.voidMineLayer.src = "./assets/images/voidMineLayer.png";
        logImageStatus("coin", this.images.coin);
        this.images.coin.src = "./assets/images/coin.png";
        logImageStatus("background", this.images.background);
        this.images.background.src = "./assets/images/background.png";
        logImageStatus("tower", this.images.tower);
        this.images.tower.src = "./assets/images/tower.png";
        logImageStatus("asteroid", this.images.asteroid);
        this.images.asteroid.src = "./assets/images/asteroid.png";

        
        this.enemyTypes = {
          zephyrScout: { health: 1, speed: 2, zigzagTimer: 0, zigzagDirection: 1, damageToPlayer: 1, damageToTower: 1 },
          nebulaStalker: { health: 3, speed: 2.5, circleRadius: 600, circleAngle: 0, shotTimer: 0, damageToPlayer: 1, damageToTower: 1 },
          solarCharger: { health: 2, speed: 4, slowSpeed: 2, chargeTarget: null, explosionRadius: 50, damageToPlayer: 2, damageToTower: 2, damageToEnemies: 2 },
          fractalShard: { health: 4, speed: 2, spiralAngle: 0, shardHealth: 1, shardSpeed: 1, damageToPlayer: 0.5, damageToTower: 0.5 },
          voidMineLayer: { health: 5, speed: 1.5, mineTimer: 0, maxMines: 3, mineLifespan: 10, damageToPlayer: 1.5, damageToTower: 1.5, damageToEnemies: 1.5 }
        };

        this.setupEventListeners();
      }

      setupEventListeners() {
        window.addEventListener("mousemove", (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
        window.addEventListener("mousedown", (e) => { if (e.button === 0) this.isShooting = true; });
        window.addEventListener("mouseup", (e) => { if (e.button === 0) this.isShooting = false; });
        window.addEventListener("keydown", (e) => {
          if (e.key === "w") this.keys.w = true;
          if (e.key === "a") this.keys.a = true;
          if (e.key === "s") this.keys.s = true;
          if (e.key === "d") this.keys.d = true;
          if (e.key === "1") this.upgradeFireRate();
          if (e.key === "2") this.placeTower();
        });
        window.addEventListener("keyup", (e) => {
          if (e.key === "w") this.keys.w = false;
          if (e.key === "a") this.keys.a = false;
          if (e.key === "s") this.keys.s = false;
          if (e.key === "d") this.keys.d = false;
        });
        window.addEventListener("touchstart", (e) => {
          e.preventDefault();
          this.isTouching = true;
          this.isShooting = true;
          const touch = e.touches[0];
          this.touchX = this.mouseX = touch.clientX;
          this.touchY = this.mouseY = touch.clientY;
        }, { passive: false });
        window.addEventListener("touchmove", (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          this.touchX = this.mouseX = touch.clientX;
          this.touchY = this.mouseY = touch.clientY;
        }, { passive: false });
        window.addEventListener("touchend", (e) => {
          e.preventDefault();
          this.isTouching = false;
          this.isShooting = false;
        }, { passive: false });

        const joystickBase = document.getElementById("joystick-base");
        const joystickHandle = this.ui.joystickHandle;

        joystickBase.addEventListener("touchstart", (e) => {
          e.preventDefault();
          this.joystickActive = true;
        }, { passive: false });

        joystickBase.addEventListener("touchmove", (e) => {
          e.preventDefault();
          if (!this.joystickActive) return;
          const touch = e.touches[0];
          const rect = joystickBase.getBoundingClientRect();
          let dx = touch.clientX - (rect.left + rect.width / 2);
          let dy = touch.clientY - (rect.top + rect.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = rect.width / 2 - joystickHandle.offsetWidth / 2;

          if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
          }

          joystickHandle.style.left = `${50 + (dx / rect.width) * 100}%`;
          joystickHandle.style.top = `${50 + (dy / rect.height) * 100}%`;

          this.joystickX = dx / maxDistance;
          this.joystickY = dy / maxDistance;
        }, { passive: false });

        joystickBase.addEventListener("touchend", (e) => {
          e.preventDefault();
          this.joystickActive = false;
          this.joystickX = 0;
          this.joystickY = 0;
          this.ui.resetJoystick();
          this.ui.sounds.shipMove.pause();
          this.ui.sounds.shipMove.currentTime = 0;
          this.moveSoundPlaying = false;
        }, { passive: false });

        // Action button listeners
        document.getElementById("turret-button").addEventListener("touchstart", (e) => {
          e.preventDefault();
          this.placeTower();
        }, { passive: false });

        document.getElementById("upgrade-button").addEventListener("touchstart", (e) => {
          e.preventDefault();
          this.upgradeFireRate();
        }, { passive: false });
      }

      reset() {
        this.gameOver = false;
        this.player.x = window.innerWidth / 2;
        this.player.y = window.innerHeight / 2;
        this.playerHealth = 3;
        this.enemies.length = 0;
        this.projectiles.length = 0;
        this.coins.length = 0;
        this.towers.length = 0;
        this.asteroids.length = 0;
        this.debris.length = 0;
        this.mines.length = 0;
        this.solarFlare = { active: false, warningTime: 0, duration: 0 };
        this.coinCount = 0;
        this.fireRate = 6;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timeSinceLastSpawn = 0;
        this.timeSinceLastShot = 0;
        this.timeSinceLastHazard = 0;
        this.timeSinceLastNebulaStalker = 0; // MARK: Reset Nebula Stalker Spawn Timer
        this.timeSinceLastZephyrScout = 0;   // MARK: Reset Zephyr Scout Spawn Timer

        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.ui.resetJoystick();
      }

      movePlayer() {
        this.isMoving = false;
        // Keyboard movement
        if (this.keys.w && this.player.y > 0) { this.player.y -= this.player.speed; this.isMoving = true; }
        if (this.keys.a && this.player.x > 0) { this.player.x -= this.player.speed; this.isMoving = true; }
        if (this.keys.s && this.player.y < this.ui.canvas.height) { this.player.y += this.player.speed; this.isMoving = true; }
        if (this.keys.d && this.player.x < this.ui.canvas.width) { this.player.x += this.player.speed; this.isMoving = true; }

        // Joystick movement
        if (this.joystickActive) {
          const moveX = this.joystickX * this.player.speed;
          const moveY = this.joystickY * this.player.speed;
          this.player.x = Math.max(0, Math.min(this.ui.canvas.width, this.player.x + moveX));
          this.player.y = Math.max(0, Math.min(this.ui.canvas.height, this.player.y + moveY));
          if (moveX !== 0 || moveY !== 0) this.isMoving = true;
        }

        // Sound handling
        if (this.isMoving && !this.moveSoundPlaying) {
          this.ui.sounds.shipMove.play().catch((error) => console.error("Error playing ship move sound:", error));
          this.moveSoundPlaying = true;
        } else if (!this.isMoving) {
          this.ui.sounds.shipMove.pause();
          this.ui.sounds.shipMove.currentTime = 0;
          this.moveSoundPlaying = false;
        }
      }

      shootProjectile() {
        const angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
        const vx = Math.cos(angle) * this.projectileSpeed;
        const vy = Math.sin(angle) * this.projectileSpeed;
        this.projectiles.push({ x: this.player.x, y: this.player.y, size: 5, vx, vy, type: 'playerShot', source: 'player' });
        this.ui.sounds.shipShoot.play().catch((error) => console.error("Error playing ship shoot sound:", error));
      }

      spawnEnemy() {
        const canvasWidth = this.ui.canvas.width || 800;
        const canvasHeight = this.ui.canvas.height || 600;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * canvasWidth; y = -this.enemySize; break;
            case 1: x = canvasWidth + this.enemySize; y = Math.random() * canvasHeight; break;
            case 2: x = Math.random() * canvasWidth; y = canvasHeight + this.enemySize; break;
            case 3: x = -this.enemySize; y = Math.random() * canvasHeight; break;
        }
        let type;
        const rand = Math.random();
        if (rand < 0.05) type = 'voidMineLayer'; // 5% chance
        else if (rand < 0.15) type = 'nebulaStalker'; // 10% chance
        else type = 'zephyrScout'; // 85% chance
        this.enemies.push({ 
          x, y, 
          health: this.enemyTypes[type].health, 
          type, 
          zigzagTimer: type === 'zephyrScout' ? 0 : undefined,  // Zephyr-specific
          zigzagDirection: type === 'zephyrScout' ? 1 : undefined, // Zephyr-specific
          circleRadius: type === 'nebulaStalker' ? this.enemyTypes.nebulaStalker.circleRadius : undefined, 
          circleAngle: type === 'nebulaStalker' ? Math.random() * 2 * Math.PI : undefined, // Random starting angle
          shotTimer: type === 'nebulaStalker' ? 0 : undefined,
          mineTimer: type === 'voidMineLayer' ? 0 : undefined // Void Mine Layer-specific
        });
      }

      spawnNebulaStalker() {
        const canvasWidth = this.ui.canvas.width || 800;
        const canvasHeight = this.ui.canvas.height || 600;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
          case 0: x = Math.random() * canvasWidth; y = -this.enemySize; break;
          case 1: x = canvasWidth + this.enemySize; y = Math.random() * canvasHeight; break;
          case 2: x = Math.random() * canvasWidth; y = canvasHeight + this.enemySize; break;
          case 3: x = -this.enemySize; y = Math.random() * canvasHeight; break;
        }
        this.enemies.push({ 
          x, y, 
          health: this.enemyTypes.nebulaStalker.health, 
          type: 'nebulaStalker', 
          circleRadius: this.enemyTypes.nebulaStalker.circleRadius,  
          circleAngle: Math.random() * 2 * Math.PI, 
          shotTimer: 0 
        });
      }

      spawnZephyrScout() {
        const canvasWidth = this.ui.canvas.width || 800;
        const canvasHeight = this.ui.canvas.height || 600;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
          case 0: x = Math.random() * canvasWidth; y = -this.enemySize; break;
          case 1: x = canvasWidth + this.enemySize; y = Math.random() * canvasHeight; break;
          case 2: x = Math.random() * canvasWidth; y = canvasHeight + this.enemySize; break;
          case 3: x = -this.enemySize; y = Math.random() * canvasHeight; break;
        }
        this.enemies.push({ 
          x, y, 
          health: this.enemyTypes.zephyrScout.health, 
          type: 'zephyrScout', 
          zigzagTimer: 0, 
          zigzagDirection: 1 
        });
      }

      spawnAsteroid() {
        const canvasWidth = this.ui.canvas.width || 800; // Default to 800 if undefined
        const canvasHeight = this.ui.canvas.height || 600; // Default to 600 if undefined
        const x = Math.random() * canvasWidth;
        const y = Math.random() * canvasHeight;
        const angle = Math.random() * 2 * Math.PI;
        this.asteroids.push({ x, y, vx: Math.cos(angle) * 1, vy: Math.sin(angle) * 1, health: 2 });
      }

      spawnDebris() {
        const canvasWidth = this.ui.canvas.width || 800;
        const canvasHeight = this.ui.canvas.height || 600;
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        switch (side) {
            case 0: x = Math.random() * canvasWidth; y = -this.debrisSize; vx = 0; vy = 4; break;
            case 1: x = canvasWidth + this.debrisSize; y = Math.random() * canvasHeight; vx = -4; vy = 0; break;
            case 2: x = Math.random() * canvasWidth; y = canvasHeight + this.debrisSize; vx = 0; vy = -4; break;
            case 3: x = -this.debrisSize; y = Math.random() * canvasHeight; vx = 4; vy = 0; break;
        }
        for (let i = 0; i < 20; i++) {
            this.debris.push({ x: x + Math.random() * 50 - 25, y: y + Math.random() * 50 - 25, vx, vy });
        }
        this.ui.sounds.debris.play().catch((error) => console.error("Error playing debris sound:", error));
      }

      triggerSolarFlare() {
        this.solarFlare.warningTime = 3; // 3-second warning
        this.ui.sounds.solarFlare.play().catch((error) => console.error("Error playing solar flare sound:", error));
      }

      dropCoin(x, y) {
        this.coins.push({ x, y });
      }

      upgradeFireRate() {
        if (this.coinCount >= 5) {
          this.coinCount -= 5;
          this.fireRate *= 1.1;
          this.ui.sounds.attackUpgrade.play().catch((error) => console.error("Error playing attack upgrade sound:", error));
        }
      }

      placeTower() {
        if (this.coinCount >= 10) {
          this.coinCount -= 10;
          this.towers.push({ x: this.player.x, y: this.player.y, timeSinceLastShot: 0, health: 5 });
          this.ui.sounds.turretPlacement.play().catch((error) => console.error("Error playing turret placement sound:", error));
        }
      }

      updateNebulaStalker(enemy) {
        let target = this.player;
        let closestDist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (this.towers.length > 0) {
          this.towers.forEach(tower => {
            let towerDist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
            if (towerDist < closestDist) { target = tower; closestDist = towerDist; }
          });
        }
        const currentEnemySpeed = this.solarFlare.active ? this.enemySpeed * 2 : this.enemySpeed;
        enemy.shotTimer += this.frameInterval / 1000;
        if (enemy.shotTimer >= 5) { // Shoot every 5 seconds
          const angleToTarget = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          const vx = Math.cos(angleToTarget) * 3; // Slow homing projectile
          const vy = Math.sin(angleToTarget) * 3;
          this.projectiles.push({ 
            x: enemy.x, y: enemy.y, size: 10, vx, vy, type: 'nebulaShot', 
            targetX: target.x, targetY: target.y, source: 'enemy' 
          });
          enemy.shotTimer = 0;
        }
        const currentDistance = Math.hypot(target.x - enemy.x, target.y - enemy.y);
        if (!enemy.previousDistance) {
          enemy.previousDistance = currentDistance;
        }
        const isMovingAway = currentDistance > enemy.previousDistance;
        enemy.previousDistance = currentDistance;
        const angularSpeed = (0.01 * currentEnemySpeed) / (enemy.circleRadius / 100);
        enemy.circleAngle += angularSpeed;
        const baseDecrement = 0.75 * currentEnemySpeed;
        const spiralMultiplier = isMovingAway ? 2 : 1;
        enemy.circleRadius = Math.max(50, enemy.circleRadius - baseDecrement * spiralMultiplier);
        const desiredX = target.x + Math.cos(enemy.circleAngle) * enemy.circleRadius;
        const desiredY = target.y + Math.sin(enemy.circleAngle) * enemy.circleRadius;
        const dx = desiredX - enemy.x;
        const dy = desiredY - enemy.y;
        const distanceToDesired = Math.hypot(dx, dy);
        if (distanceToDesired > 0) {
          const moveSpeed = currentEnemySpeed * 2;
          const moveX = (dx / distanceToDesired) * moveSpeed;
          const moveY = (dy / distanceToDesired) * moveSpeed;
          enemy.x += moveX;
          enemy.y += moveY;
        }
      }

      updateZephyrScout(enemy) {
        let target = this.player;
        let closestDist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
        if (this.towers.length > 0) {
          this.towers.forEach(tower => {
            let towerDist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
            if (towerDist < closestDist) { target = tower; closestDist = towerDist; }
          });
        }
        const currentEnemySpeed = this.solarFlare.active ? this.enemySpeed * 2 : this.enemySpeed;
        enemy.zigzagTimer += this.frameInterval / 1000;
        if (enemy.zigzagTimer >= 1) { // Zigzag every 1 second
          enemy.zigzagDirection *= -1;
          enemy.zigzagTimer = 0;
        }
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.x += Math.cos(angle) * currentEnemySpeed + (enemy.zigzagDirection * 10 * (this.frameInterval / 1000) * this.enemyTypes.zephyrScout.speed);
        enemy.y += Math.sin(angle) * currentEnemySpeed;
      }

      updateVoidMineLayer(enemy) {
        let target = this.player;
        let closestDist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
        if (this.towers.length > 0) {
          this.towers.forEach(tower => {
            let towerDist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
            if (towerDist < closestDist) { target = tower; closestDist = towerDist; }
          });
        }
        const currentEnemySpeed = this.solarFlare.active ? this.enemySpeed * 2 : this.enemySpeed;
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.x += Math.cos(angle) * currentEnemySpeed;
        enemy.y += Math.sin(angle) * currentEnemySpeed;

        // Mine dropping logic
        enemy.mineTimer += this.frameInterval / 1000;
        if (enemy.mineTimer >= 5 && this.mines.length < this.enemyTypes.voidMineLayer.maxMines) { // Drop mine every 5 seconds, max 3 mines
          this.mines.push({ x: enemy.x, y: enemy.y, lifespan: this.enemyTypes.voidMineLayer.mineLifespan });
          enemy.mineTimer = 0;
        }
      }

      update(timestamp) {
        if (this.gameOver) return;

        if (!this.startTime) this.startTime = timestamp;
        this.elapsedTime = (timestamp - this.startTime) / 1000;

        this.movePlayer();

        this.timeSinceLastSpawn += this.frameInterval / 1000;
        if (this.timeSinceLastSpawn >= 1 / this.spawnRate) {
            this.spawnEnemy();
            this.timeSinceLastSpawn = 0;
        }

        this.timeSinceLastNebulaStalker += this.frameInterval / 1000;
        if (this.timeSinceLastNebulaStalker >= Math.random() * 10 + 15) {
          this.spawnNebulaStalker();
          this.timeSinceLastNebulaStalker = 0;
        }

        this.timeSinceLastZephyrScout += this.frameInterval / 1000;
        if (this.timeSinceLastZephyrScout >= Math.random() * 5 + 10) {
          this.spawnZephyrScout();
          this.timeSinceLastZephyrScout = 0;
        }

        const currentFireRate = this.solarFlare.active ? this.fireRate / 2 : this.fireRate;
        this.timeSinceLastShot += this.frameInterval / 1000;
        if (this.timeSinceLastShot >= 1 / currentFireRate && this.isShooting) {
            this.shootProjectile();
            this.timeSinceLastShot = 0;
        }

        this.timeSinceLastHazard += this.frameInterval / 1000;
        if (this.timeSinceLastHazard >= Math.random() * 5 + 15) {
            const hazard = Math.floor(Math.random() * 3);
            if (hazard === 0) {
                this.spawnAsteroid();
                console.log("Spawned asteroid at:", this.asteroids[this.asteroids.length - 1]);
            } else if (hazard === 1) {
                this.triggerSolarFlare();
                console.log("Triggered solar flare");
            } else {
                this.spawnDebris();
                console.log("Spawned debris cluster");
            }
            this.timeSinceLastHazard = 0;
        }

        let hazardWarning = "";
        if (this.solarFlare.warningTime > 0) {
            this.solarFlare.warningTime -= this.frameInterval / 1000;
            hazardWarning = "Solar Flare Incoming!";
            if (this.solarFlare.warningTime <= 0) {
                this.solarFlare.active = true;
                this.solarFlare.duration = 5; // 5-second duration
            }
        }
        if (this.solarFlare.active) {
            this.solarFlare.duration -= this.frameInterval / 1000;
            if (this.solarFlare.duration <= 0) this.solarFlare.active = false;
        }

        this.enemies.forEach(enemy => {
          if (enemy.type === 'nebulaStalker') {
            this.updateNebulaStalker(enemy);
          } else if (enemy.type === 'zephyrScout') {
            this.updateZephyrScout(enemy);
          } else if (enemy.type === 'voidMineLayer') {
            this.updateVoidMineLayer(enemy);
          }
        });

        this.towers.forEach((tower, towerIndex) => {
          let nearestEnemy = null;
          let nearestDistance = this.towerRange;
          this.enemies.forEach((enemy) => {
              const dist = Math.hypot(tower.x - enemy.x, tower.y - enemy.y);
              if (dist < nearestDistance) {
                  nearestEnemy = enemy;
                  nearestDistance = dist;
              }
          });

          if (nearestEnemy) {
              tower.timeSinceLastShot += this.frameInterval / 1000;
              const towerFireRate = this.solarFlare.active ? this.towerFireRate / 2 : this.towerFireRate;
              if (tower.timeSinceLastShot >= 1 / towerFireRate) {
                  const angle = Math.atan2(nearestEnemy.y - tower.y, nearestEnemy.x - tower.x);
                  const vx = Math.cos(angle) * this.projectileSpeed;
                  const vy = Math.sin(angle) * this.projectileSpeed;
                  this.projectiles.push({ x: tower.x, y: tower.y, size: 5, vx, vy, source: 'turret' });
                  this.ui.sounds.turretShoot.play().catch((error) => console.error("Error playing turret shoot sound:", error));
                  tower.timeSinceLastShot = 0;
              }
          }
        });

        this.ui.updateHUD(this.elapsedTime, this.coinCount, currentFireRate, this.playerHealth, hazardWarning);
      }

      draw() {
        const backgroundMusic = document.getElementById("background-music");
        const ctx = this.ui.ctx;
        ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

        ctx.drawImage(this.images.background, 0, 0, this.ui.canvas.width, this.ui.canvas.height);

        const angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(angle);
        ctx.drawImage(this.images.player, -this.player.size / 2, -this.player.size / 2, this.player.size, this.player.size);
        ctx.restore();

        const projectilesToRemove = [];
        this.projectiles.forEach((proj, index) => {
          if (proj.type === 'nebulaShot' && proj.source === 'enemy') {
            const angleToTarget = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
            proj.vx += Math.cos(angleToTarget) * 0.1;
            proj.vy += Math.sin(angleToTarget) * 0.1;
            proj.x += proj.vx;
            proj.y += proj.vy;
            ctx.fillStyle = "purple";
            ctx.fillRect(proj.x - proj.size / 2, proj.y - proj.size / 2, proj.size, proj.size);
            const playerDist = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);
            if (playerDist < this.player.size / 2 + proj.size / 2) {
              this.playerHealth -= 1;
              this.projectiles.splice(index, 1);
              if (this.playerHealth <= 0) {
                this.gameOver = true;
                this.ui.endGame(backgroundMusic);
                this.ui.sounds.shipDestroy.play().catch((error) => console.error("Error playing sound:", error));
              }
              return;
            }
            this.towers.forEach((tower, tIndex) => {
              const towerDist = Math.hypot(proj.x - tower.x, proj.y - tower.y);
              if (towerDist < this.towerSize / 2 + proj.size / 2) {
                tower.health -= 1;
                this.projectiles.splice(index, 1);
                if (tower.health <= 0) {
                  this.towers.splice(tIndex, 1);
                }
                return;
              }
            });
          } else if (proj.source === 'player' || proj.source === 'turret') {
            proj.x += proj.vx;
            proj.y += proj.vy;
            ctx.fillStyle = "yellow"; 
            ctx.fillRect(proj.x - proj.size / 2, proj.y - proj.size / 2, proj.size, proj.size);
          }
          if (proj.x < 0 || proj.x > this.ui.canvas.width || proj.y < 0 || proj.y > this.ui.canvas.height) {
            projectilesToRemove.push(index);
          }
        });

        const currentEnemySpeed = this.solarFlare.active ? this.enemySpeed * 2 : this.enemySpeed;
        const enemiesToRemove = [];
        this.enemies.forEach((enemy, index) => {
            if (enemy.type === 'nebulaStalker') {
              ctx.drawImage(this.images.nebulaStalker, enemy.x - this.enemySize / 2, enemy.y - this.enemySize / 2, this.enemySize, this.enemySize);
            } else if (enemy.type === 'solarCharger') {
              ctx.drawImage(this.images.solarCharger, enemy.x - this.enemySize / 2, enemy.y - this.enemySize / 2, this.enemySize, this.enemySize);
            } else if (enemy.type === 'fractalShard') {
              ctx.drawImage(this.images.fractalShard, enemy.x - this.enemySize / 2, enemy.y - this.enemySize / 2, this.enemySize, this.enemySize);
            } else if (enemy.type === 'voidMineLayer') {
              ctx.drawImage(this.images.voidMineLayer, enemy.x - this.enemySize / 2, enemy.y - this.enemySize / 2, this.enemySize, this.enemySize);
            } else {
              ctx.drawImage(this.images.zephyrScout, enemy.x - this.enemySize / 2, enemy.y - this.enemySize / 2, this.enemySize, this.enemySize);
            }
            const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist < this.player.size / 2 + this.enemySize / 2) {
              const damage = this.enemyTypes[enemy.type].damageToPlayer;
              this.playerHealth -= damage;
              enemiesToRemove.push(index);
              if (this.playerHealth <= 0) {
                this.gameOver = true;
                this.ui.endGame(backgroundMusic);
                this.ui.sounds.shipDestroy.play().catch((error) => console.error("Error playing ship destroy sound:", error));
              }
            }
            if (this.towers.length > 0) {
                const towersToRemove = [];
                this.towers.forEach((tower, tIndex) => {
                    const towerDist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
                    if (towerDist < this.towerSize / 2 + this.enemySize / 2) {
                      const damage = this.enemyTypes[enemy.type].damageToTower;
                      if (isNaN(tower.health)) tower.health = 0;
                      tower.health = Math.max(0, tower.health - damage);
                        if (tower.health <= 0) {
                            towersToRemove.push(tIndex);
                        }
                        enemiesToRemove.push(index);
                    }
                });
                towersToRemove.sort((a, b) => b - a).forEach(tIndex => this.towers.splice(tIndex, 1));
            }

            this.projectiles.forEach((proj, projIndex) => {
              const projDist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
              if (projDist < proj.size / 2 + this.enemySize / 2 && (proj.source === 'player' || proj.source === 'turret')) {
                enemy.health -= this.projectileDamage;
                projectilesToRemove.push(projIndex);
                if (enemy.health <= 0) {
                  enemiesToRemove.push(index);
                  this.ui.sounds.enemyDeath.play().catch((error) => console.error("Error playing enemy death sound:", error));
                  this.dropCoin(enemy.x, enemy.y);
                }
              }
            });
          });

        const coinsToRemove = [];
        this.coins.forEach((coin, index) => {
            ctx.drawImage(this.images.coin, coin.x - this.coinSize / 2, coin.y - this.coinSize / 2, this.coinSize, this.coinSize);
            const dist = Math.hypot(this.player.x - coin.x, this.player.y - coin.y);
            if (dist < this.player.size / 2 + this.coinSize / 2) {
                if (index >= 0 && index < this.coins.length) {
                    coinsToRemove.push(index);
                    this.coinCount++;
                }
            }
        });

        const towersToRemoveFinal = [];
        this.towers.forEach((tower) => {
          ctx.drawImage(this.images.tower, tower.x - this.towerSize / 2, tower.y - this.towerSize / 2, this.towerSize, this.towerSize);
          ctx.fillStyle = "red";
          ctx.fillRect(tower.x - 25, tower.y - 35, 50 * (tower.health / 5), 5);
          ctx.fillStyle = "white";
          ctx.font = "14px Arial";
          ctx.fillText(`HP: ${tower.health}`, tower.x - 15, tower.y - 40);
        });

        const asteroidsToRemove = [];
        this.asteroids.forEach((asteroid, index) => {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            ctx.drawImage(this.images.asteroid, asteroid.x - this.asteroidSize / 2, asteroid.y - this.asteroidSize / 2, this.asteroidSize, this.asteroidSize);

            const playerDist = Math.hypot(this.player.x - asteroid.x, this.player.y - asteroid.y);
            if (playerDist < this.player.size / 2 + this.asteroidSize / 2 && this.playerHealth > 0) {
                this.playerHealth -= 1;
                asteroidsToRemove.push(index);
                this.ui.sounds.asteroidHit.play().catch((error) => console.error("Error playing asteroid hit sound:", error));
            }

            this.towers.forEach((tower, tIndex) => {
                const towerDist = Math.hypot(tower.x - asteroid.x, tower.y - asteroid.y);
                if (towerDist < this.towerSize / 2 + this.asteroidSize / 2) {
                    tower.health -= 1;
                    asteroidsToRemove.push(index);
                    if (tower.health <= 0) {
                        towersToRemoveFinal.push(tIndex);
                    }
                }
            });

            this.enemies.forEach((enemy, eIndex) => {
                const enemyDist = Math.hypot(enemy.x - asteroid.x, enemy.y - asteroid.y);
                if (enemyDist < this.enemySize / 2 + this.asteroidSize / 2) {
                    enemiesToRemove.push(eIndex);
                    this.dropCoin(enemy.x, enemy.y);
                    this.ui.sounds.enemyDeath.play().catch((error) => console.error("Error playing enemy death sound:", error));
                }
            });

            this.projectiles.forEach((proj, pIndex) => {
                const projDist = Math.hypot(proj.x - asteroid.x, proj.y - asteroid.y);
                if (projDist < proj.size / 2 + this.asteroidSize / 2) {
                    asteroid.health -= 1;
                    projectilesToRemove.push(pIndex);
                    if (asteroid.health <= 0) {
                        asteroidsToRemove.push(index);
                        this.playerHealth+=1
                        this.ui.sounds.asteroidHit.play().catch((error) => console.error("Error playing asteroid hit sound:", error));
                    }
                }
            });

            if (asteroid.x < -this.asteroidSize || asteroid.x > this.ui.canvas.width + this.asteroidSize ||
                asteroid.y < -this.asteroidSize || asteroid.y > this.ui.canvas.height + this.asteroidSize) {
                asteroidsToRemove.push(index);
            }
        });

        const debrisToRemove = [];
        this.debris.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            ctx.fillStyle = "gray";
            ctx.fillRect(particle.x - this.debrisSize / 2, particle.y - this.debrisSize / 2, this.debrisSize, this.debrisSize);

            const playerDist = Math.hypot(this.player.x - particle.x, this.player.y - particle.y);
            if (playerDist < this.player.size / 2 + this.debrisSize / 2 && this.playerHealth > 0) {
                this.playerHealth -= 0.5;
                debrisToRemove.push(index);
            }

            this.towers.forEach((tower, tIndex) => {
                const towerDist = Math.hypot(tower.x - particle.x, tower.y - particle.y);
                if (towerDist < this.towerSize / 2 + this.debrisSize / 2) {
                    tower.health -= 0.5;
                    debrisToRemove.push(index);
                    if (tower.health <= 0) {
                        towersToRemoveFinal.push(tIndex);
                    }
                }
            });

            this.enemies.forEach((enemy, eIndex) => {
                const enemyDist = Math.hypot(enemy.x - particle.x, enemy.y - particle.y);
                if (enemyDist < this.enemySize / 2 + this.debrisSize / 2) {
                    enemy.health -= 0.5;
                    debrisToRemove.push(index);
                    if (enemy.health <= 0) {
                        enemiesToRemove.push(eIndex);
                        this.dropCoin(enemy.x, enemy.y);
                        this.ui.sounds.enemyDeath.play().catch((error) => console.error("Error playing enemy death sound:", error));
                    }
                }
            });

            if (particle.x < -this.debrisSize || particle.x > this.ui.canvas.width + this.debrisSize ||
                particle.y < -this.debrisSize || particle.y > this.ui.canvas.height + this.debrisSize) {
                debrisToRemove.push(index);
            }
        });

        const minesToRemove = [];
        this.mines.forEach((mine, index) => {
          mine.lifespan -= this.frameInterval / 1000;
          ctx.fillStyle = mine.lifespan <= 1 ? "orange" : "red"; // Orange in last second
          ctx.beginPath();
          ctx.arc(mine.x, mine.y, 10, 0, Math.PI * 2);
          ctx.fill();

          this.projectiles.forEach((proj, pIndex) => {
            const projDist = Math.hypot(proj.x - mine.x, proj.y - mine.y);
            if (projDist < proj.size / 2 + 10 && (proj.source === 'player' || proj.source === 'turret')) {
              minesToRemove.push(index);
              projectilesToRemove.push(pIndex);
            }
          });

          if (mine.lifespan <= 0) {
            minesToRemove.push(index);
            const explosionRadius = 50;
            const playerDist = Math.hypot(mine.x - this.player.x, mine.y - this.player.y);
            if (playerDist < explosionRadius && this.playerHealth > 0) {
              this.playerHealth -= this.enemyTypes.voidMineLayer.damageToPlayer;
              if (this.playerHealth <= 0) {
                this.gameOver = true;
                this.ui.endGame(backgroundMusic);
                this.ui.sounds.shipDestroy.play().catch((error) => console.error("Error playing ship destroy sound:", error));
              }
            }
            this.towers.forEach((tower, tIndex) => {
              const towerDist = Math.hypot(mine.x - tower.x, mine.y - tower.y);
              if (towerDist < explosionRadius) {
                tower.health -= this.enemyTypes.voidMineLayer.damageToTower;
                if (tower.health <= 0) {
                  towersToRemoveFinal.push(tIndex);
                }
              }
            });
            this.enemies.forEach((enemy, eIndex) => {
              const enemyDist = Math.hypot(mine.x - enemy.x, mine.y - enemy.y);
              if (enemyDist < explosionRadius) {
                enemy.health -= this.enemyTypes.voidMineLayer.damageToEnemies;
                if (enemy.health <= 0) {
                  enemiesToRemove.push(eIndex);
                  this.dropCoin(enemy.x, enemy.y);
                  this.ui.sounds.enemyDeath.play().catch((error) => console.error("Error playing enemy death sound:", error));
                }
              }
            });
          }
        });

        if (this.solarFlare.active) {
            ctx.fillStyle = "rgba(255, 100, 0, 0.3)";
            ctx.fillRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
        }

        enemiesToRemove.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.enemies.length) this.enemies.splice(index, 1);
        });
        projectilesToRemove.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.projectiles.length) this.projectiles.splice(index, 1);
        });
        coinsToRemove.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.coins.length) this.coins.splice(index, 1);
        });
        asteroidsToRemove.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.asteroids.length) this.asteroids.splice(index, 1);
        });
        debrisToRemove.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.debris.length) this.debris.splice(index, 1);
        });
        minesToRemove.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.mines.length) this.mines.splice(index, 1);
        });
        towersToRemoveFinal.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < this.towers.length) this.towers.splice(index, 1);
        });

        if (this.playerHealth <= 0) {
            this.gameOver = true;
            this.ui.endGame(backgroundMusic);
            this.ui.sounds.shipDestroy.play().catch((error) => console.error("Error playing ship destroy sound:", error));
        }
      }
    }

    class Game {
      constructor() {
        this.ui = new GameUI();
        this.logic = new GameLogic(this.ui);
        this.animationFrameId = null;
        this.isPaused = false;
      }

      prepareGame() {
        window.addEventListener("resize", () => this.ui.resizeCanvas());
        this.ui.resizeCanvas();
        this.assignButtons();
      }

      startGame() {
        this.logic.reset();
        this.ui.startGame();
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.gameLoop(0);
      }

      gameLoop(timestamp) {
        if (this.logic.gameOver) return;

        const deltaTime = timestamp - this.logic.lastFrameTime;
        if (deltaTime > this.logic.frameInterval) {
          this.logic.update(timestamp);
          this.logic.draw();
          this.logic.lastFrameTime = timestamp;
        }

        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
      }

      pause() {
        this.isPaused = true;
        cancelAnimationFrame(this.animationFrameId);
      }

      resume() {
        this.isPaused = false;
        this.gameLoop(0);
      }

      assignButtons() {
        const addButtonListener = (id, callback) => {
          const button = document.getElementById(id);
          if (button) {
            button.addEventListener("click", callback);
            button.addEventListener("touchstart", (e) => {
              e.preventDefault();
              callback();
            }, { passive: false });
          }
        };

        addButtonListener("play-button", () => {
            console.log("Play button clicked!");
            this.startGame();
          });
        addButtonListener("settings-button", () => this.ui.settings());
        addButtonListener("instructions-button", () => this.ui.instructions());
        addButtonListener("play-again-button", () => this.startGame());
        addButtonListener("settings-back-button", () => this.ui.mainMenu());
        addButtonListener("instructions-back-button", () => this.ui.mainMenu());
        addButtonListener("main-menu-button", () => this.ui.mainMenu());
        addButtonListener("game-menu-button", () => this.ui.mainMenu());
        addButtonListener("game-restart-button", () => this.startGame());
        addButtonListener("game-instructions-button", () => {
          this.pause();
          this.ui.instructions();
          const backButton = document.getElementById("instructions-back-button");
          const handler = () => {
            this.ui.swapToScreen(this.ui.gameScreen);
            this.resume();
            backButton.removeEventListener("click", handler);
            backButton.removeEventListener("touchstart", handler);
          };
          backButton.addEventListener("click", handler);
          backButton.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handler();
          }, { passive: false });
        });
      }
    }

    const game = new Game();
    game.prepareGame();
  });