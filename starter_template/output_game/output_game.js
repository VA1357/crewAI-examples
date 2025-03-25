const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let playerX = canvas.width / 2;
let playerY = canvas.height - 50;
let playerSpeed = 5;
let playerHealth = 100;
let score = 0;
let enemies = [];
let bullets = [];
let gameOver = false;
let gameStarted = false;


// Player
const playerWidth = 30;
const playerHeight = 30;

// Bullets
const bulletSpeed = 10;
const bulletWidth = 5;
const bulletHeight = 10;

// Enemies
const enemySpeed = 2;
const enemyWidth = 30;
const enemyHeight = 30;
const maxEnemies = 10;



function startGame() {
  gameStarted = true;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';
  gameLoop();
}


function restartGame() {
    playerX = canvas.width / 2;
    playerY = canvas.height - 50;
    playerHealth = 100;
    score = 0;
    enemies = [];
    bullets = [];
    gameOver = false;
    updateHealthDisplay(playerHealth);
    updateScoreDisplay(score);
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    gameLoop();
}


function updateHealthDisplay(health) {
    document.getElementById('healthDisplay').innerText = "Health: " + health;
}

function updateScoreDisplay(score){
    document.getElementById('scoreDisplay').innerText = "Score: " + score;
}

function updateGameOverScore(score){
    document.getElementById('gameOverScore').innerText = "Score: " + score;
}


function spawnEnemy() {
    const x = Math.random() * (canvas.width - enemyWidth);
    const y = -enemyHeight;
    enemies.push({ x, y });
}


function movePlayer(dx, dy) {
    playerX += dx * playerSpeed;
    playerY += dy * playerSpeed;

    // Keep player within bounds
    playerX = Math.max(0, Math.min(playerX, canvas.width - playerWidth));
    playerY = Math.max(0, Math.min(playerY, canvas.height - playerHeight));
}


function shootBullet() {
    const bulletX = playerX + playerWidth / 2 - bulletWidth / 2;
    const bulletY = playerY;
    bullets.push({ x: bulletX, y: bulletY });
}


function moveBullets() {
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].y -= bulletSpeed;

        // Remove off-screen bullets
        if (bullets[i].y < -bulletHeight) {
            bullets.splice(i, 1);
            i--;
        }
    }
}


function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].y += enemySpeed;

        //Remove off screen enemies
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            i--;
        }
    }
}


function checkCollisions() {
    for (let i = 0; i < bullets.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (
                bullets[i].x < enemies[j].x + enemyWidth &&
                bullets[i].x + bulletWidth > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemyHeight &&
                bullets[i].y + bulletHeight > enemies[j].y
            ) {
                // Collision detected
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score++;
                i--;
                j--;
                updateScoreDisplay(score);
                break; //Exit inner loop since enemy is destroyed
            }
        }
    }
    //Check for player-enemy collisions
    for (let i = 0; i < enemies.length; i++) {
        if (
          playerX < enemies[i].x + enemyWidth &&
          playerX + playerWidth > enemies[i].x &&
          playerY < enemies[i].y + enemyHeight &&
          playerY + playerHeight > enemies[i].y
        ) {
          playerHealth -= 10;
          enemies.splice(i, 1);
          i--;
          updateHealthDisplay(playerHealth);
          if (playerHealth <= 0) {
            gameOver = true;
          }
        }
      }
}


function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
}



function drawBullets() {
    ctx.fillStyle = 'yellow';
    for (let i = 0; i < bullets.length; i++) {
        ctx.fillRect(bullets[i].x, bullets[i].y, bulletWidth, bulletHeight);
    }
}


function drawEnemies() {
    ctx.fillStyle = 'red';
    for (let i = 0; i < enemies.length; i++) {
        ctx.fillRect(enemies[i].x, enemies[i].y, enemyWidth, enemyHeight);
    }
}


function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  updateGameOverScore(score);
  document.getElementById('gameOverScreen').style.display = 'block';
  document.getElementById('gameContainer').style.display = 'none';
}


function gameLoop() {
    if (!gameStarted) return;
    if (gameOver) {
      drawGameOver();
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    if (enemies.length < maxEnemies && Math.random() < 0.02) {
      spawnEnemy();
    }


    moveEnemies();
    moveBullets();
    checkCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();
    updateHealthDisplay(playerHealth);

    if(enemies.length === 0 && !gameOver){
        gameOver = true;
        drawGameOver();
    }
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'w') {
        movePlayer(0, -1);
    } else if (event.key === 's') {
        movePlayer(0, 1);
    } else if (event.key === 'a') {
        movePlayer(-1, 0);
    } else if (event.key === 'd') {
        movePlayer(1, 0);
    } else if (event.key === ' ') {
        shootBullet();
    }
});

document.getElementById('playButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', restartGame);
