// File: backend/middleware/isAdminMiddleware.js

module.exports = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next(); // ✅ L'utilisateur est admin, on continue
  } else {
    console.warn(`[ADMIN] Accès refusé pour userId=${req.user?.userId || 'inconnu'} depuis ${req.ip}`);
    return res.status(403).json({ error: 'Accès interdit : administrateur requis' });
  }
};
