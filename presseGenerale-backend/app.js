// File: user-backend/app.js

const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { getSignature } = require('./routes/zoomCtrl');
const apiRouter = require('./apiRouter').router;
const { sequelize, Message } = require('./models');

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

const fallbackOrigins = [
  'https://cppeurope.net',
  'https://www.cppeurope.net',
];

const effectiveAllowedOrigins = allowedOrigins.length > 0
  ? allowedOrigins
  : fallbackOrigins;

console.log('🌍 CORS allowedOrigins (presseGenerale-backend) :', effectiveAllowedOrigins);

// 🔐 CORS
app.use(cors({
  origin: function (origin, callback) {
    // 1️⃣ Requêtes sans origin (curl, Postman, etc.)
    if (!origin) {
      console.log("⚠️ Requête sans origin → acceptée (requête serveur ou interne)");
      return callback(null, true);
    }

    console.log("🌍 Origin reçu :", origin);
    console.log("📜 Liste des origins autorisés :", effectiveAllowedOrigins);

    // 2️⃣ Validation stricte
    if (isDev || effectiveAllowedOrigins.includes(origin)) {
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
app.get('/', (req, res) => res.status(200).send('PRESSE-GENERALE-BACKEND (prod) actif'));
app.get('/api/zoom/signature', getSignature);

// Point de vérité public utilisé par media-backend pour autoriser/refuser les uploads.
app.get('/api/presse-generale/messages/:id/format', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    const hasFormatColumn = !!(Message.rawAttributes && Message.rawAttributes.format);
    const attrs = hasFormatColumn ? ['id', 'format'] : ['id'];
    const msg = await Message.findByPk(id, { attributes: attrs });
    if (!msg) {
      return res.status(404).json({ error: 'not found' });
    }

    const fmt = hasFormatColumn && msg.format != null && msg.format !== '' ? String(msg.format) : null;
    return res.status(200).json({ id: msg.id, format: fmt });
  } catch (e) {
    return res.status(500).json({ error: 'db error', details: e.message });
  }
});

app.use('/api', apiRouter);

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