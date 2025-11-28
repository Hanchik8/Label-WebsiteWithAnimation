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
  
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const radius = player.width / 2;
  
  // Тень бублика
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;
  
  // Основной бублик с градиентом
  const gradient = ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY, radius);
  gradient.addColorStop(0, '#ffeb99');
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(1, '#ffb347');
  
  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#cc8800';
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Дырка в центре (глазури)
  ctx.fillStyle = '#664400';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  
  // Блеск глазури
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // Цветные глазури (сахар) на бублике
  const sprinkleCount = 12;
  for (let i = 0; i < sprinkleCount; i++) {
    const angle = (Math.PI * 2 * i) / sprinkleCount;
    const sprinkleX = centerX + Math.cos(angle) * radius * 0.75;
    const sprinkleY = centerY + Math.sin(angle) * radius * 0.75;
    
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9f43', '#a8e6cf', '#ff6b9d'];
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(sprinkleX, sprinkleY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Анимация прыжка (добавляем легкий эффект)
  if (player.jumping) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.save();
  
  if (obstacle.type === 'fork') {
    // Рисуем красивую вилку
    const centerX = obstacle.x + 15;
    const topY = obstacle.y + 5;
    
    // Ручка вилки
    const gradient = ctx.createLinearGradient(0, topY, 0, topY + obstacle.height);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(1, '#ffb347');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 2, topY + 20, 4, obstacle.height - 20);
    
    // Зубцы вилки (4 тонких острых зубца)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const forkTop = topY;
    for (let i = 0; i < 4; i++) {
      const x = centerX - 6 + i * 4;
      ctx.beginPath();
      ctx.moveTo(x, forkTop);
      ctx.lineTo(x, forkTop + 12);
      ctx.stroke();
    }
    
    // Соединительная часть
    ctx.beginPath();
    ctx.moveTo(centerX - 7, forkTop + 12);
    ctx.lineTo(centerX + 7, forkTop + 12);
    ctx.stroke();
    
    // Тень и блеск
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
  } else if (obstacle.type === 'spoon') {
    // Рисуем красивую ложку
    const centerX = obstacle.x + 15;
    const topY = obstacle.y + 5;
    
    // Ручка ложки (с градиентом)
    const gradient = ctx.createLinearGradient(0, topY, 0, topY + obstacle.height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ff4757');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(centerX - 2, topY + 20);
    ctx.lineTo(centerX + 2, topY + 20);
    ctx.lineTo(centerX + 2.5, topY + obstacle.height);
    ctx.lineTo(centerX - 2.5, topY + obstacle.height);
    ctx.fill();
    
    // Чаша ложки (круглая, красивая)
    const spoonTop = topY + 8;
    ctx.fillStyle = 'rgba(255, 107, 107, 0.9)';
    ctx.beginPath();
    ctx.ellipse(centerX, spoonTop, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Внутренняя часть чаши (блеск)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX - 3, spoonTop - 2, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Граница чаши
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, spoonTop, 10, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
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
  if (gameRunning && !player.jumping) {
    player.jumping = true;
    player.velocityY = -16;
  }
}

function duck(isDucking) {
  if (gameRunning && !player.jumping) {
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
    console.log('Space pressed, jumping:', !player.jumping);
    jump();
  } else if (e.code === 'ArrowDown') {
    e.preventDefault();
    console.log('Arrow Down pressed');
    duck(true);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') {
    e.preventDefault();
    console.log('Arrow Up released');
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