// File: user-backend/middleware/authMiddleware.js

const jwtUtils = require('../utils/jwt.utils');

function firstHeaderValue(v) {
  return String(v || '')
    .split(',')[0]
    .trim();
}

function uniqueNonEmpty(values) {
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))];
}

function resolveProbeUrls(req) {
  const envMeUrl = String(process.env.USER_BACKEND_ME_URL || '').trim();
  const envAdminUrl = String(process.env.USER_BACKEND_ADMIN_CHECK_URL || '').trim();
  const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '').trim();
  const looksStagingEnv = /:9085\b|staging\.cppeurope\.net/i.test(allowedOrigins);
  const stagingMeUrl = looksStagingEnv ? envMeUrl.replace(':17001/', ':9085/') : '';
  const stagingAdminUrl = looksStagingEnv ? envAdminUrl.replace(':17001/', ':9085/') : '';

  const host = firstHeaderValue(req.headers['x-forwarded-host'] || req.headers.host);
  const proto = firstHeaderValue(req.headers['x-forwarded-proto']) || 'http';
  const originFromRequest = host ? `${proto}://${host}` : '';
  const requestMeUrl = originFromRequest ? `${originFromRequest}/api/users/me` : '';
  const requestAdminUrl = originFromRequest ? `${originFromRequest}/api/users/all/` : '';
  return {
    meUrls: uniqueNonEmpty([stagingMeUrl, envMeUrl, requestMeUrl]),
    adminUrls: uniqueNonEmpty([stagingAdminUrl, envAdminUrl, requestAdminUrl]),
  };
}

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
  if (decoded && decoded.userId >= 0) {
    req.userId = decoded.userId;
    req.user = decoded;
    return next();
  }

  // Fallback staging/proxy : valider le token auprès du user-backend public.
  const { meUrls, adminUrls } = resolveProbeUrls(req);

  let meProbe = { ok: false };
  for (const candidate of meUrls) {
    meProbe = await probeUserBackend(candidate, token);
    if (meProbe.ok && meProbe.body && Number.isFinite(Number(meProbe.body.id))) break;
  }
  if (!meProbe.ok || !meProbe.body || !Number.isFinite(Number(meProbe.body.id))) {
    console.warn(`[AUTH] Token rejeté (local + introspection) depuis ${req.ip}`);
    return res.status(403).json({ error: 'Accès refusé. Token invalide ou expiré.' });
  }

  let adminProbe = { ok: false };
  for (const candidate of adminUrls) {
    adminProbe = await probeUserBackend(candidate, token);
    if (adminProbe.ok) break;
  }
  req.userId = Number(meProbe.body.id);
  req.user = {
    userId: Number(meProbe.body.id),
    // /users/all est protégé admin : 2xx => admin confirmé par user-backend.
    isAdmin: !!adminProbe.ok,
    email: meProbe.body.email || null,
  };
  return next();
};
