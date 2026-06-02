// File : media-backend/controllers/uploadVideoController.js

const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { Media } = require('../models');
const {
  normalizeFormat,
  isUnknownFormat,
  allowsVideoForFormat,
  maxVideosForFormat,
} = require('../utils/presseFormatGate');

function parseMessageId(body) {
  const raw = body && body.messageId;
  if (raw === undefined || raw === null || raw === '') return null;
  const n = parseInt(String(raw), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseFormatHint(body) {
  const raw = body && (body.format || body.articleFormat || body.presseFormat);
  return normalizeFormat(raw);
}

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

    const messageId = parseMessageId(req.body);
    if (!messageId) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(400).json({ error: 'messageId invalide ou manquant.' });
    }

    const fmt = parseFormatHint(req.body);
    if (isUnknownFormat(fmt)) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(400).json({ error: 'format manquant (article-photo, article-video, article-thumbnail-video, article).' });
    }

    if (!allowsVideoForFormat(fmt)) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(403).json({ error: "Ce type d'article n'accepte pas de vidéo." });
    }

    const existingVideos = await Media.count({ where: { messageId, type: 'video' } });
    const maxVideos = maxVideosForFormat(fmt);
    if (existingVideos >= maxVideos) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(409).json({ error: `Quota vidéo atteint pour ce format (${existingVideos}/${maxVideos}).` });
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
