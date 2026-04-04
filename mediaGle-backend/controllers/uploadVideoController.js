const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { Media } = require("../models");
const { fetchPresseFormat, allowsVideoForFormat, isUnknownFormat } = require("../utils/presseFormatGate");

function parseMessageId(body) {
  const raw = body && body.messageId;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseInt(String(raw), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const MAX_BYTES = process.env.UPLOAD_LIMIT_BYTES
  ? parseInt(process.env.UPLOAD_LIMIT_BYTES, 10)
  : 600 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "..", process.env.UPLOAD_VIDEOS_PATH || "uploads/videos");
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      return cb(err);
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".mp4", ".mov", ".avi", ".mkv"].includes(ext)) {
      return cb(new Error("Seules les vidéos sont autorisées"));
    }
    cb(null, true);
  },
});

const uploadVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
  }

  try {
    const messageId = parseMessageId(req.body);
    if (!messageId) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(400).json({
        error: "messageId invalide ou manquant (requis pour lier la vidéo au message presse).",
      });
    }

    const fmt = await fetchPresseFormat(messageId);
    if (isUnknownFormat(fmt)) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(503).json({
        error:
          "Impossible de vérifier le format de l'article (presse indisponible ou message introuvable).",
      });
    }
    if (!allowsVideoForFormat(fmt)) {
      try {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(403).json({ error: "Ce type d'article n'accepte pas de vidéo." });
    }

    const mediaFile = await Media.create({
      filename: req.file.filename,
      path: req.file.path,
      type: "video",
      messageId,
    });

    res.status(201).json({
      message: "Vidéo uploadée avec succès",
      media: mediaFile,
    });
  } catch (error) {
    console.error("Erreur upload vidéo:", error);
    res.status(500).json({ error: "Erreur du serveur" });
  }
};

module.exports = {
  upload,
  uploadVideo,
};
