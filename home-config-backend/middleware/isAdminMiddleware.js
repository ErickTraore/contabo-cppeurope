module.exports = (req, res, next) => {
  const admin = req.user && (req.user.isAdmin === true || req.user.isAdmin === 1);
  if (admin) return next();
  return res.status(403).json({ error: 'Accès interdit : administrateur requis' });
};
