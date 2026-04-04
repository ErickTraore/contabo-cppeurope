const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize } = require('./models');

const app = express();
dotenv.config({ path: path.join(__dirname, '.env.production') });

const BASE_ORIGIN = process.env.REACT_APP_URL;
const fromAllowedEnv = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [
  BASE_ORIGIN,
  BASE_ORIGIN && BASE_ORIGIN.replace('://', '://www.'),
  ...fromAllowedEnv,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowOrigin =
    origin &&
    (process.env.NODE_ENV !== 'production'
      ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      : allowedOrigins.includes(origin));
  if (allowOrigin && origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const MAX_UPLOAD = process.env.UPLOAD_LIMIT_MB ? `${process.env.UPLOAD_LIMIT_MB}mb` : '600mb';
app.use(express.json({ limit: MAX_UPLOAD }));
app.use(express.urlencoded({ extended: true, limit: MAX_UPLOAD }));

app.use('/imagesprofile', express.static(path.join(__dirname, 'uploads/imagesprofile')));
app.use('/mediaprofile', express.static(path.join(__dirname, 'public/mediaprofile')));
app.use('/api/user-media-profile/mediaprofile', express.static(path.join(__dirname, 'public/mediaprofile')));

const apiRouter = require('./apiRouter').router;
app.use('/api/user-media-profile', apiRouter);

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
