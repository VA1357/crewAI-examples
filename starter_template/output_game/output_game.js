const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

//Game Variables
let score = 0;
let health = 3;
let level = 1;
let gameOver = false;
let gamePaused = false;
let comboMultiplier = 1;
let comboTimer = 0;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 20,
  height: 30,
  speed: 5,
  health: 3,
  fireRate: 10, // shots per second
  lastShot: 0,
  projectiles: [],
  shield: 0, // Shield strength
  powerups: {}
};

const enemies = [];
const powerups = [];

//Power-up definitions
const powerupTypes = {
  SHIELD: {name: "Shield", duration: 5000, effect: (player) => {player.shield += 2;}, indicator: "🛡️"},
  RAPID_FIRE: {name: "Rapid Fire", duration: 5000, effect: (player) => {player.fireRate *= 2;}, indicator: "🔥"},
  INCREASED_SPEED: {name: "Increased Speed", duration: 5000, effect: (player) => {player.speed *= 2;}, indicator: "💨"},
  HEALTH_REGENERATION: {name: "Health Regeneration", duration: 0, effect: (player) => {player.health = Math.min(player.health + 1, 3);}, indicator: "❤️"}, //added health cap
  BOMB: {name: "Bomb", duration: 0, effect: (player) => {player.bomb = true;}, indicator: "💣"}
};

function spawnEnemy() {
    const enemyType = Math.random() < 0.8 ? 'standard' : 'boss'; // 80% chance of standard enemy, 20% of boss
    let enemy;
    if (enemyType === 'standard') {
        enemy = {
            x: Math.random() * canvas.width,
            y: -20,
            width: 20,
            height: 20,
            speed: 2 + level * 0.5,
            health: 1 + Math.floor(level / 3),
            points: 10 + level * 5
        };
    } else { // Boss
        enemy = {
            x: canvas.width / 2 - 50,
            y: -100,
            width: 100,
            height: 100,
            speed: 1,
            health: 50 + level * 10,
            points: 1000 + level * 200,
            attackPattern: 'basic' // Add more complex patterns later
        };
    }
    enemies.push(enemy);
}


function spawnPowerup(){
    const powerupType = Object.keys(powerupTypes)[Math.floor(Math.random() * Object.keys(powerupTypes).length)];
    const powerup = {
        x: Math.random() * canvas.width,
        y: -20,
        width: 20,
        height: 20,
        speed: 2,
        type: powerupType
    };
    powerups.push(powerup);
}


function updateGame(){
    if(gameOver || gamePaused) return;

    //Player Movement
    if (keysPressed['w']) player.y -= player.speed;
    if (keysPressed['s']) player.y += player.speed;
    if (keysPressed['a']) player.x -= player.speed;
    if (keysPressed['d']) player.x += player.speed;

    //Keep player within bounds
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));

    //Shooting
    const currentTime = Date.now();
    if (keysPressed[' '] && currentTime - player.lastShot > 1000/player.fireRate){
        player.lastShot = currentTime;
        player.projectiles.push({x: player.x + player.width/2, y: player.y, width: 5, height: 10, speed: 10});
    }

    //Update projectiles
    player.projectiles.forEach((projectile, index) => {
        projectile.y -= projectile.speed;
        if(projectile.y < 0) player.projectiles.splice(index, 1);
    });


    //Update Enemies
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if(enemy.y > canvas.height) {
          enemies.splice(index, 1);
        }

        //Collision detection player-enemy
        if (collisionDetection(player, enemy)) {
          if (player.shield > 0) {
            player.shield--;
          } else {
            player.health--;
            if (player.health <= 0) gameOver = true;
          }
          enemies.splice(index, 1);
          comboMultiplier = 1; //reset combo on hit

        }
        //Collision detection projectile-enemy
        player.projectiles.forEach((projectile, projectileIndex) => {
            if (collisionDetection(projectile, enemy)) {
                enemy.health--;
                player.projectiles.splice(projectileIndex, 1);
                if (enemy.health <= 0) {
                    score += enemy.points * comboMultiplier;
                    enemies.splice(index, 1);
                    comboTimer = Date.now(); // reset combo timer
                }
            }
        })
    });

    //Update powerups
    powerups.forEach((powerup, index) => {
        powerup.y += powerup.speed;
        if(powerup.y > canvas.height) powerups.splice(index, 1);
        if(collisionDetection(player, powerup)){
            powerupTypes[powerup.type].effect(player);
            powerups.splice(index, 1);
            //add powerup indicator to UI
            displayPowerupIndicator(powerup.type);
        }

    })


    //Combo Multiplier
    if (Date.now() - comboTimer > 3000) comboMultiplier = 1;
    else comboMultiplier++;


    //Level progression
    if(enemies.length === 0 && level < 10){
        level++;
        for (let i = 0; i < level * 2; i++) {
            spawnEnemy();
        }
        spawnPowerup();
    }

    //Check for Boss
    if(level % 3 === 0){
        spawnEnemy();
    }

    //Update Power-up effects
    updatePowerups();

    draw();
}



function collisionDetection(obj1, obj2){
    return (obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y);
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    //Draw projectiles
    ctx.fillStyle = 'white';
    player.projectiles.forEach(projectile => ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height));

    //Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height));

    //Draw powerups
    ctx.fillStyle = 'yellow';
    powerups.forEach(powerup => ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height));

    //UI updates
    document.getElementById('score').innerText = score;
    document.getElementById('health').innerText = player.health;
    document.getElementById('level').innerText = level;
}

//Key handling
const keysPressed = {};
document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    if (e.key === 'p') gamePaused = !gamePaused; // Pause/Unpause
});
document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

//Power-up handling
function updatePowerups(){
  for(let powerup in player.powerups){
    if(player.powerups[powerup].endTime < Date.now()){
      delete player.powerups[powerup];
      //Consider adding visual feedback for powerup expiry
    }
  }
}


function displayPowerupIndicator(powerupType){
  const indicator = powerupTypes[powerupType].indicator;
  const indicatorElement = document.createElement('span');
  indicatorElement.innerText = `${indicator} `;
  document.getElementById('powerupIndicators').appendChild(indicatorElement);

  //Remove indicator after duration
  setTimeout(() => indicatorElement.remove(), powerupTypes[powerupType].duration)
}


//Game initialization
for (let i = 0; i < level * 2; i++) {
    spawnEnemy();
}
spawnPowerup();
setInterval(updateGame, 1000/60);