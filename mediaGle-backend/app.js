// File: media-backend/app.js

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const app = express();

// 🔐 Charger .env.production
dotenv.config({ path: path.join(__dirname, '.env.production') });

// 🌍 Origines autorisées : REACT_APP_URL + ALLOWED_ORIGINS (liste séparée par virgules)
const BASE_ORIGIN = process.env.REACT_APP_URL;
const allowedOrigins = [
  BASE_ORIGIN && BASE_ORIGIN.replace('://', '://www.'),
].filter(Boolean);

const extraAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

const allAllowedOrigins = [...new Set([...allowedOrigins, ...extraAllowedOrigins])];

// CORS global
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allAllowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Parsers
// 📦 Limite d’upload depuis .env
const MAX_UPLOAD = process.env.UPLOAD_LIMIT_MB
  ? `${process.env.UPLOAD_LIMIT_MB}mb`
  : "600mb"; // fallback sécurisé

app.use(express.json({ limit: MAX_UPLOAD }));
app.use(express.urlencoded({ extended: true, limit: MAX_UPLOAD }));

// 🔓 Fichiers statiques uploadés
app.use('/api/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/api/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

// 🔹 Images par défaut

// Routes API media (préfixe /api/media/)
const apiRouter = require('./apiRouter').router;
app.use('/api/media', apiRouter);


// Importer sequelize pour la supervision BDD
const { sequelize } = require('./models');

// Route GET / pour la supervision
app.get('/', (req, res) => {
  res.send('OK');
});

// Route GET /api/ping pour supervision BDD
app.get('/api/ping', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ ok: true, db: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'error', error: e.message });
  }
});

module.exports = app;