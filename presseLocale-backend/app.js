// File: user-backend/app.js

const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { getSignature } = require('./routes/zoomCtrl');
const apiRouter = require('./apiRouter').router;
const { sequelize } = require('./models');

const app = express();

// 🔐 Charger .env.production en prod
dotenv.config({ path: path.join(__dirname, '.env.production') });

// 🧩 Construire ALLOWED_ORIGINS à partir de REACT_APP_URL si non défini
// ex: REACT_APP_URL=https://lespremices.com
if (!process.env.ALLOWED_ORIGINS && process.env.REACT_APP_URL) {
  const base = process.env.REACT_APP_URL;
  process.env.ALLOWED_ORIGINS = [
    base,                                      // https://lespremices.com
    base.replace('://', '://www.'),            // https://www.lespremices.com
  ].join(',');
}

const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(o => o.length > 0);

console.log('🌍 CORS allowedOrigins (presseLocale-backend) :', allowedOrigins);

// 🔐 CORS
app.use(cors({
  origin: function (origin, callback) {
    // 1️⃣ Requêtes sans origin (curl, Postman, etc.)
    if (!origin) {
      console.log("⚠️ Requête sans origin → acceptée (requête serveur ou interne)");
      return callback(null, true);
    }

    console.log("🌍 Origin reçu :", origin);
    console.log("📜 Liste des origins autorisés :", allowedOrigins);

    // 2️⃣ Validation stricte
    if (isDev || allowedOrigins.includes(origin)) {
      console.log("✅ CORS autorisé pour :", origin);
      return callback(null, true);
    }

    // 3️⃣ Refus explicite
    console.log("❌ CORS refusé pour :", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.options('*', cors());

// 📦 Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔁 Routes
app.get('/', (req, res) => res.status(200).send('PRESSE-LOCALE-BACKEND (prod) actif'));
app.get('/api/zoom/signature', getSignature);
app.get('/api/ping', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ ok: true, db: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'error', error: e.message });
  }
});
app.use('/api', apiRouter);

module.exports = app;