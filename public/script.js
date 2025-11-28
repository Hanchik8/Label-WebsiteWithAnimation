let currentCarouselIndex = 0;
const totalBranches = 6;
const cardsVisible = 3;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupScrollAnimations();
});

async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      const data = await response.json();
      showUserProfile(data.user);
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

function showLogin() {
  document.getElementById('loginForm').classList.add('active');
  document.getElementById('registerForm').classList.remove('active');
  document.getElementById('userProfile').classList.remove('active');
}

function showRegister() {
  document.getElementById('registerForm').classList.add('active');
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('userProfile').classList.remove('active');
}

function showUserProfile(user) {
  document.getElementById('userProfile').classList.add('active');
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('registerForm').classList.remove('active');
  document.getElementById('usernameDisplay').textContent = user.username;
}

async function register() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  if (!username || !email || !password) {
    showNotification('Заполните все поля', 'error');
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('Регистрация успешна!', 'success');
      showUserProfile(data.user);
    } else {
      showNotification(data.error || 'Ошибка регистрации', 'error');
    }
  } catch (error) {
    showNotification('Ошибка соединения', 'error');
  }
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showNotification('Заполните все поля', 'error');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('Добро пожаловать!', 'success');
      showUserProfile(data.user);
    } else {
      showNotification(data.error || 'Ошибка входа', 'error');
    }
  } catch (error) {
    showNotification('Ошибка соединения', 'error');
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    showNotification('Вы вышли из аккаунта', 'success');
    showLogin();
  } catch (error) {
    showNotification('Ошибка выхода', 'error');
  }
}

function goToGame() {
  const userProfile = document.getElementById('userProfile');
  if (!userProfile.classList.contains('active')) {
    showNotification('Войдите в аккаунт для игры', 'error');
    return;
  }
  window.location.href = '/game.html';
}

function moveCarousel(direction) {
  currentCarouselIndex += direction;
  
  if (currentCarouselIndex < 0) {
    currentCarouselIndex = totalBranches - cardsVisible;
  } else if (currentCarouselIndex > totalBranches - cardsVisible) {
    currentCarouselIndex = 0;
  }

  const track = document.getElementById('carouselTrack');
  const cardWidth = track.querySelector('.branch-card').offsetWidth;
  const gap = 20;
  const offset = -(currentCarouselIndex * (cardWidth + gap));
  
  track.style.transform = `translateX(${offset}px)`;
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  document.querySelectorAll('.dish-card').forEach(el => {
    observer.observe(el);
  });
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}