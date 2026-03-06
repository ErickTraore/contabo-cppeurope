// File : media-backend/routes/uploadVideo.js

const express = require('express');
const router = express.Router();
const { upload, uploadVideo } = require('../controllers/uploadVideoController');

// Route pour uploader une vidéo
router.post('/', (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload vidéo :', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Fichier trop volumineux' });
      }
      return res.status(400).json({ error: err.message || 'Fichier vidéo invalide' });
    }
    return next();
  });
}, uploadVideo);

module.exports = router;
