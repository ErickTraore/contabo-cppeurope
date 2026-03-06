// File : media-backend/routes/getMedia.js

const express = require('express');
const router = express.Router();
const getMediaController = require('../controllers/getMediaController'); // ✅ Correction de l’import

// ✅ Route correcte pour récupérer les médias liés à un message
router.get('/:messageId', getMediaController.getMedia);

module.exports = router;
