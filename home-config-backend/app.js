const path = require('path');
require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '.env.production')
      : path.join(__dirname, '.env.development'),
});

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { getUploadDir } = require('./middleware/multerHomeImage');
const apiRouter = require('./apiRouter').router;

const app = express();

const homeUploadDir = getUploadDir();
fs.mkdirSync(homeUploadDir, { recursive: true });

const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isDev || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

app.use(
  '/api/home-config/media',
  express.static(homeUploadDir, {
    maxAge: '7d',
    index: false,
  })
);

app.get('/', (req, res) => res.status(200).send('HOME-CONFIG-BACKEND actif'));
app.get('/api/ping', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api', apiRouter);

module.exports = app;
