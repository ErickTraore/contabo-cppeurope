// File : media-backend/routes/uploadImage.js

const express = require('express');
const router = express.Router();
const { upload, uploadImage } = require('../controllers/uploadImageController');

// Route pour uploader une image
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload image :', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Fichier trop volumineux' });
      }
      return res.status(400).json({ error: err.message || 'Fichier image invalide' });
    }
    return next();
  });
}, uploadImage);

module.exports = router;
