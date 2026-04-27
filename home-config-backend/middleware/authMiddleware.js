const jwtUtils = require('../utils/jwt.utils');

async function probeUserBackend(url, token) {
  const target = String(url || '').trim();
  if (!target) return { ok: false };
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(target, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Format de token invalide.' });
  }
  const decoded = jwtUtils.decodeToken(token);
  if (decoded && decoded.userId >= 0) {
    req.userId = decoded.userId;
    req.user = decoded;
    return next();
  }

  // Fallback staging/proxy: valider le token auprès du user-backend public.
  const meUrl = process.env.USER_BACKEND_ME_URL;
  const adminCheckUrl = process.env.USER_BACKEND_ADMIN_CHECK_URL;
  const meProbe = await probeUserBackend(meUrl, token);
  if (!meProbe.ok || !meProbe.body || !Number.isFinite(Number(meProbe.body.id))) {
    return res.status(403).json({ error: 'Token invalide ou expiré.' });
  }

  const adminProbe = await probeUserBackend(adminCheckUrl, token);
  req.userId = Number(meProbe.body.id);
  req.user = {
    userId: Number(meProbe.body.id),
    // /users/all est protégé admin: 2xx => admin confirmé par user-backend.
    isAdmin: !!adminProbe.ok,
    email: meProbe.body.email || null,
  };
  return next();
};
