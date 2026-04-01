const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { Media } = require("../models");
const { fetchPresseFormat, allowsImageForFormat, isUnknownFormat } = require("../utils/presseFormatGate");

const MAX_BYTES = process.env.UPLOAD_LIMIT_BYTES
  ? parseInt(process.env.UPLOAD_LIMIT_BYTES, 10)
  : 600 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "..", process.env.UPLOAD_IMAGES_PATH || "uploads/images");
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

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"];

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
      return cb(new Error("Seules les images sont autorisées (jpg, jpeg, png, gif, webp, heic, heif)"));
    }
    cb(null, true);
  },
});

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
  }

  try {
    const messageId = req.body.messageId || null;
    if (messageId) {
      const fmt = await fetchPresseFormat(messageId);
      if (isUnknownFormat(fmt)) {
        try {
          const fs = require("fs");
          if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch (e) {}
        return res.status(503).json({
          error:
            "Impossible de vérifier le format de l'article (presse indisponible ou message introuvable).",
        });
      }
      if (!allowsImageForFormat(fmt)) {
        try {
          const fs = require("fs");
          if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch (e) {}
        return res.status(403).json({ error: "Ce type d'article n'accepte pas d'image." });
      }
    }

    const mediaFile = await Media.create({
      filename: req.file.filename,
      path: req.file.path,
      type: "image",
      messageId: messageId || null,
    });

    res.status(201).json({ message: "Image uploadée avec succès", media: mediaFile });
  } catch (error) {
    console.error("Erreur upload image:", error);
    res.status(500).json({ error: "Erreur du serveur" });
  }
};

module.exports = {
  upload,
  uploadImage,
};
