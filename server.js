const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'label_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'label_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    req.session.userId = result.rows[0].id;
    req.session.username = result.rows[0].username;
    
    res.json({ 
      success: true, 
      user: { 
        username: result.rows[0].username,
        email: result.rows[0].email 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    
    res.json({ 
      success: true, 
      user: { 
        username: user.username,
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

app.get('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.post('/api/save-score', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  const { score } = req.body;
  
  try {
    let discount = 0;
    if (score >= 30) {
      discount = 30;
    } else if (score >= 20) {
      discount = 20;
    } else if (score >= 10) {
      discount = 10;
    } else if (score >= 5) {
      discount = 5;
    }

    if (discount > 0) {
      const promoCode = generatePromoCode(discount);
      
      await pool.query(
        'INSERT INTO promocodes (user_id, code, discount, score) VALUES ($1, $2, $3, $4)',
        [req.session.userId, promoCode, discount, score]
      );

      res.json({ 
        success: true, 
        score, 
        discount,
        promoCode 
      });
    } else {
      res.json({ 
        success: true, 
        score,
        discount: 0,
        message: 'Наберите минимум 5 очков для получения промокода' 
      });
    }
  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

app.get('/api/promocodes', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  try {
    const result = await pool.query(
      'SELECT code, discount, score, created_at FROM promocodes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.session.userId]
    );

    res.json({ promocodes: result.rows });
  } catch (error) {
    console.error('Get promocodes error:', error);
    res.status(500).json({ error: 'Ошибка получения промокодов' });
  }
});

function generatePromoCode(discount) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'LABEL';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  code += discount;
  return code;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});