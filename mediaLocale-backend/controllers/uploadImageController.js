// File: media-backend/controllers/uploadImageController.js

const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { Media } = require('../models');
const {
  normalizeFormat,
  isUnknownFormat,
  allowsImageForFormat,
  maxImagesForFormat,
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
    const dest = path.join(__dirname, '..', process.env.UPLOAD_IMAGES_PATH || 'uploads/images');
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

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];

// 🛡️ Multer configuré avec .env
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
      return cb(new Error('Seules les images sont autorisées (jpg, jpeg, png, gif, webp, heic, heif)'));
    }
    cb(null, true);
  }
});

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
  }

  try {
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

    if (!allowsImageForFormat(fmt)) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(403).json({ error: "Ce type d'article n'accepte pas d'image." });
    }

    const existingImages = await Media.count({ where: { messageId, type: 'image' } });
    const maxImages = maxImagesForFormat(fmt);
    if (existingImages >= maxImages) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(409).json({ error: `Quota image atteint pour ce format (${existingImages}/${maxImages}).` });
    }

    const relDir = process.env.UPLOAD_IMAGES_PATH || 'uploads/images';
    const dbPath = path.join(relDir, req.file.filename).replace(/\\/g, '/');

    const mediaFile = await Media.create({
      filename: req.file.filename,
      path: dbPath,
      type: 'image',
      messageId,
    });

    res.status(201).json({ message: 'Image uploadée avec succès', media: mediaFile });
  } catch (error) {
    console.error("❌ Erreur lors de l'upload de l'image :", error);
    res.status(500).json({ error: "Erreur du serveur" });
  }
};

module.exports = {
  upload,
  uploadImage
};
