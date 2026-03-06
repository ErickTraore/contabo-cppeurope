const express = require('express');
const uploadImageProfileRoutes = require('./routes/uploadImageProfile');
const mediaProfileController = require('./controllers/mediaProfileController');

const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  res.send('USER-MEDIA-PROFILE-BACKEND (prod) actif');
});

apiRouter.use('/uploadImageProfile', uploadImageProfileRoutes);
apiRouter.route('/mediaProfile/:profileId').get(mediaProfileController.getMediaByProfileId);
apiRouter.route('/mediaProfile').post(mediaProfileController.createMediaProfile);
apiRouter.route('/mediaProfile/:id').put(mediaProfileController.updateMediaProfile);
apiRouter.route('/mediaProfile/:id').delete(mediaProfileController.deleteMediaProfile);

module.exports = { router: apiRouter };
