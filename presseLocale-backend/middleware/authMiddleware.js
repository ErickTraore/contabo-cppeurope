// File: user-backend/middleware/authMiddleware.js

const jwtUtils = require('../utils/jwt.utils');

module.exports = (req, res, next) => {
  const authorization = req.headers['authorization'];

  if (!authorization) {
    console.warn(`[AUTH] Requête sans header Authorization depuis ${req.ip}`);
    return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
  }

  const token = authorization.split(' ')[1];
  if (!token) {
    console.warn(`[AUTH] Format de token invalide : ${authorization}`);
    return res.status(401).json({ error: 'Accès refusé. Format de token invalide.' });
  }

  const decoded = jwtUtils.decodeToken(token);
  if (!decoded || decoded.userId < 0) {
    console.warn(`[AUTH] Token rejeté : ${JSON.stringify(decoded)} depuis ${req.ip}`);    
    return res.status(403).json({ error: 'Accès refusé sign-1. Token invalide ou expiré.' });
  }

  req.userId = decoded.userId;
  req.user = decoded;
  next();
};
