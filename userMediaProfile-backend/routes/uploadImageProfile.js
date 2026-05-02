// Fichier : lespremices/media-backend/routes/uploadImageProfile.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 📦 Charger la limite depuis .env
const MAX_BYTES = process.env.UPLOAD_LIMIT_BYTES
  ? parseInt(process.env.UPLOAD_LIMIT_BYTES, 10)
  : 600 * 1024 * 1024; // fallback sécurisé

// 📁 Définir le stockage des fichiers avec chemin ABSOLU
const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_PROFILE_PATH || 'uploads/imagesprofile');
// Créer le répertoire s'il n'existe pas (évite ENOENT au premier upload)
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// 🛡️ Multer configuré avec .env
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(new Error('Seules les images JPG/PNG sont autorisées'));
    }
    cb(null, true);
  }
});

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu' });
  }

  res.json({ filename: req.file.filename });
});

module.exports = router;
