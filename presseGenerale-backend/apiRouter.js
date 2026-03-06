// File: user-backend/apiRouter.js

const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware');
const messagesCtrl = require('./routes/messagesCtrl');
const isAdminMiddleware = require('./middleware/isAdminMiddleware');

exports.router = (function () {
    const apiRouter = express.Router();

    apiRouter.route('/messages/new/').post(authMiddleware, isAdminMiddleware, messagesCtrl.createMessage);
    apiRouter.route('/messages/').get(authMiddleware, messagesCtrl.listMessages);
    apiRouter.route('/messages/:id').put(authMiddleware, isAdminMiddleware, messagesCtrl.updateMessage);
    apiRouter.route('/messages/:id').delete(authMiddleware, isAdminMiddleware, messagesCtrl.deleteMessage);

    return apiRouter;
})();
