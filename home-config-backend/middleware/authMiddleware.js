const jwtUtils = require('../utils/jwt.utils');

module.exports = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Format de token invalide.' });
  }
  const decoded = jwtUtils.decodeToken(token);
  if (!decoded || decoded.userId < 0) {
    return res.status(403).json({ error: 'Token invalide ou expiré.' });
  }
  req.userId = decoded.userId;
  req.user = decoded;
  next();
};
