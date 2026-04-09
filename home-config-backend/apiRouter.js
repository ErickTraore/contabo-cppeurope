const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');
const isAdminMiddleware = require('./middleware/isAdminMiddleware');
const homeConfigCtrl = require('./routes/homeConfigCtrl');

const apiRouter = express.Router();
apiRouter.get('/home-config', homeConfigCtrl.getHomeConfig);
apiRouter.put('/home-config', authMiddleware, isAdminMiddleware, homeConfigCtrl.putHomeConfig);

exports.router = apiRouter;
