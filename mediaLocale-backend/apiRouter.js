//File media-backend/apiRouter.js

const express = require('express');
const uploadImageRoutes = require('./routes/uploadImage');
const uploadVideoRoutes = require('./routes/uploadVideo');
const getMediaRoutes = require('./routes/getMedia'); // ✅ Ajout de la nouvelle route
const { deleteMedia } = require('./controllers/getMediaController');

const apiRouter = express.Router();
// ICI on met la route racine
apiRouter.get('/', (req, res) => {
  res.send('MEDIA-BACKEND (prod) actif');
});
// Routes pour récupérer et uploader des fichiers
apiRouter.use('/uploadImage', uploadImageRoutes);
apiRouter.use('/uploadVideo', uploadVideoRoutes);
apiRouter.use('/getMedia', getMediaRoutes);

// ✅ Nouvelle route pour récupérer les médias

// ✅ Route pour supprimer un média de message
apiRouter.route('/media/:id').delete(deleteMedia);

module.exports = { router: apiRouter };