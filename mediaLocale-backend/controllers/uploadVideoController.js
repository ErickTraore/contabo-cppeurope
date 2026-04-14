// File : media-backend/controllers/uploadVideoController.js

const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { Media } = require('../models');

// 📦 Charger la limite depuis .env
const MAX_BYTES = process.env.UPLOAD_LIMIT_BYTES
  ? parseInt(process.env.UPLOAD_LIMIT_BYTES, 10)
  : 600 * 1024 * 1024; // fallback sécurisé

// 📁 Définir le stockage des fichiers avec chemin ABSOLU
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', process.env.UPLOAD_VIDEOS_PATH || 'uploads/videos');
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      return cb(err);
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// 🛡️ Multer configuré avec .env
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
      return cb(new Error('Seules les vidéos sont autorisées'));
    }
    cb(null, true);
  }
});

const uploadVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
  }

  try {
    console.log('📥 Vidéo reçue :', req.file);
    console.log('📦 req.body:', req.body);

    const relDir = process.env.UPLOAD_VIDEOS_PATH || 'uploads/videos';
    const dbPath = path.join(relDir, req.file.filename).replace(/\\/g, '/');

    const rawMid = req.body && req.body.messageId;
    const messageId = parseInt(String(rawMid), 10);
    if (!Number.isFinite(messageId) || messageId <= 0) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(400).json({ error: 'messageId invalide ou manquant.' });
    }

    const mediaFile = await Media.create({
      filename: req.file.filename,
      path: dbPath,
      type: 'video',
      messageId,
    });

    res.status(201).json({
      message: 'Vidéo uploadée avec succès',
      media: mediaFile
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'upload de la vidéo :", error);
    console.error('❌ Erreur Sequelize :', error.message);
    res.status(500).json({ error: "Erreur du serveur" });
  }
};

module.exports = {
  upload,
  uploadVideo
};
