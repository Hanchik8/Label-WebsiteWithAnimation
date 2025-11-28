const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let score = 0;
let gameSpeed = 5;
let gravity = 0.6;

const player = {
  x: 50,
  y: canvas.height - 80,
  width: 40,
  height: 40,
  velocityY: 0,
  jumping: false,
  ducking: false,
  normalHeight: 40,
  duckHeight: 25
};

let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 100;

function drawPlayer() {
  ctx.save();
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const radius = player.width / 2;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  const sprinkleCount = 8;
  for (let i = 0; i < sprinkleCount; i++) {
    const angle = (Math.PI * 2 * i) / sprinkleCount;
    const sprinkleX = centerX + Math.cos(angle) * radius * 0.7;
    const sprinkleY = centerY + Math.sin(angle) * radius * 0.7;
    
    ctx.fillStyle = ['#ff6b6b', '#4ecdc4', '#ffe66d'][i % 3];
    ctx.fillRect(sprinkleX - 2, sprinkleY - 4, 4, 8);
  }
  
  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.save();
  
  if (obstacle.type === 'fork') {
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(obstacle.x + 15, obstacle.y);
    ctx.lineTo(obstacle.x + 15, obstacle.y + obstacle.height);
    ctx.stroke();
    
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 5 + i * 7, obstacle.y);
      ctx.lineTo(obstacle.x + 5 + i * 7, obstacle.y + 15);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#c0c0c0';
    
    ctx.beginPath();
    ctx.ellipse(obstacle.x + 15, obstacle.y + 10, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillRect(obstacle.x + 12, obstacle.y + 10, 6, obstacle.height - 10);
  }
  
  ctx.restore();
}

function drawGround() {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 30);
  ctx.lineTo(canvas.width, canvas.height - 30);
  ctx.stroke();
  
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(i, canvas.height - 28, 20, 2);
  }
}

function createObstacle() {
  const types = ['fork', 'spoon'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    x: canvas.width,
    y: canvas.height - 30 - (type === 'fork' ? 40 : 35),
    width: 30,
    height: type === 'fork' ? 40 : 35,
    type: type
  };
}

function checkCollision(player, obstacle) {
  const playerHeight = player.ducking ? player.duckHeight : player.normalHeight;
  
  return player.x < obstacle.x + obstacle.width &&
         player.x + player.width > obstacle.x &&
         player.y < obstacle.y + obstacle.height &&
         player.y + playerHeight > obstacle.y;
}

function updateGame() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Применяем гравитацию всегда
  if (player.jumping) {
    player.velocityY += gravity;
    player.y += player.velocityY;

    if (player.y >= canvas.height - 80) {
      player.y = canvas.height - 80;
      player.jumping = false;
      player.velocityY = 0;
      score++;
      updateScoreDisplay();
    }
  }

  if (player.ducking && !player.jumping) {
    player.height = player.duckHeight;
    player.y = canvas.height - 80 + (player.normalHeight - player.duckHeight);
  } else if (!player.ducking) {
    player.height = player.normalHeight;
    player.y = canvas.height - 80;
  }

  obstacleTimer++;
  if (obstacleTimer > obstacleInterval) {
    obstacles.push(createObstacle());
    obstacleTimer = 0;
  }

  obstacles.forEach((obstacle, index) => {
    obstacle.x -= gameSpeed;

    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(index, 1);
      score++;
      updateScoreDisplay();
    }

    if (checkCollision(player, obstacle)) {
      gameOver();
      return;
    }

    drawObstacle(obstacle);
  });

  drawGround();
  drawPlayer();

  requestAnimationFrame(updateGame);
}

function jump() {
  if (gameRunning && !player.jumping && !player.ducking) {
    player.jumping = true;
    player.velocityY = -15;
    player.y -= 5;
  }
}

function duck(isDucking) {
  if (gameRunning) {
    player.ducking = isDucking;
  }
}

function startGame() {
  gameRunning = true;
  score = 0;
  obstacles = [];
  obstacleTimer = 0;
  player.y = canvas.height - 80;
  player.jumping = false;
  player.ducking = false;
  player.velocityY = 0;
  updateScoreDisplay();
  updateGame();
}

function gameOver() {
  gameRunning = false;
  saveScore();
}

async function saveScore() {
  try {
    const response = await fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score })
    });

    const data = await response.json();
    
    document.getElementById('finalScore').textContent = score;
    
    const promoResult = document.getElementById('promoResult');
    
    if (data.promoCode) {
      promoResult.innerHTML = `
        <div class="discount-badge">Скидка ${data.discount}%</div>
        <div class="promo-code">${data.promoCode}</div>
        <p>Промокод сохранен в вашем аккаунте!</p>
      `;
    } else if (data.message) {
      promoResult.innerHTML = `<p>${data.message}</p>`;
    }
    
    document.getElementById('gameOverModal').classList.add('show');
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

function restartGame() {
  document.getElementById('gameOverModal').classList.remove('show');
  startGame();
}

function goHome() {
  window.location.href = '/';
}

function updateScoreDisplay() {
  document.getElementById('scoreDisplay').textContent = score;
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    jump();
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault();
    duck(true);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') {
    duck(false);
  }
});

canvas.addEventListener('click', () => {
  if (gameRunning) {
    jump();
  }
});

drawGround();
drawPlayer();