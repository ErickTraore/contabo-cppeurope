// File: media-backend/controllers/uploadImageController.js

const multer = require('multer');
const path = require('path');
const { Media } = require('../models'); // ✅ Correction de l'import

// Définir le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      return cb(new Error('Seules les images sont autorisées'));
    }
    cb(null, true);
  }
});

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
  }

  try {
    // ✅ Création du média dans la base de données
    const mediaFile = await Media.create({
      filename: req.file.filename,
      path: req.file.path,
      type: 'image',
      messageId: req.body.messageId || null,
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
