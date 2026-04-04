// File: media-backend/app.js

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const app = express();

// Charger dynamiquement le bon fichier .env selon NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.join(__dirname, envFile) });

// 🌍 Origines autorisées : REACT_APP_URL + ALLOWED_ORIGINS (ex. localhost E2E)
const BASE_ORIGIN = process.env.REACT_APP_URL;
const fromEnvList = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);
const allowedOrigins = [
  BASE_ORIGIN,
  BASE_ORIGIN && BASE_ORIGIN.replace('://', '://www.'),
  ...fromEnvList,
].filter(Boolean);

// CORS global
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
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
app.use('/api/uploads-locale/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/api/uploads-locale/videos', express.static(path.join(__dirname, 'uploads/videos')));

// 🔹 Images par défaut

// Routes API media (préfixe /api/media/)
const apiRouter = require('./apiRouter').router;
app.use('/api/media-locale', apiRouter);


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