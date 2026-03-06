// File: user-backend/routes/sessionCtrl.js
const jwtUtils = require('../utils/jwt.utils');

module.exports = {
  extendSession: (req, res) => {
    const refreshToken = req.headers['authorization']?.split(' ')[1];
    if (!refreshToken) return res.status(401).json({ error: 'Token manquant' });

    const decoded = jwtUtils.verifyRefreshToken(refreshToken);
    if (!decoded) return res.status(403).json({ error: 'Token invalide ou expiré' });

    const newAccessToken = jwtUtils.generateExtendSessionToken({
      id: decoded.userId,
      isAdmin: decoded.isAdmin || false
    });

    return res.status(200).json({ accessToken: newAccessToken });
  }
};
