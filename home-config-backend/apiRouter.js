const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');
const isAdminMiddleware = require('./middleware/isAdminMiddleware');
const { uploadHomeImageSingle, maxFileBytes } = require('./middleware/multerHomeImage');
const maxFileMo = Math.round(maxFileBytes / (1024 * 1024));
const homeConfigCtrl = require('./routes/homeConfigCtrl');

const apiRouter = express.Router();

function runMulterUpload(req, res, next) {
  uploadHomeImageSingle(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `Fichier trop volumineux (max ${maxFileMo} Mo).` });
    }
    return res.status(400).json({ error: err.message || 'Upload invalide.' });
  });
}

apiRouter.get('/home-config', homeConfigCtrl.getHomeConfig);
apiRouter.put('/home-config', authMiddleware, isAdminMiddleware, homeConfigCtrl.putHomeConfig);
apiRouter.post(
  '/home-config/upload',
  authMiddleware,
  isAdminMiddleware,
  runMulterUpload,
  homeConfigCtrl.uploadHomeImage
);

exports.router = apiRouter;
