// File: user-backend/utils/jwt.utils.js

const jwt = require('jsonwebtoken');
const JWT_SIGN_SECRET = process.env.JWT_SIGN_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const EXPIRE_SESSION = process.env.EXPIRE_SESSION;
const EXPIRE_EXTEND_SESSION = process.env.EXPIRE_EXTEND_SESSION;
const JWT_SIGN_SECRET_COMPAT = process.env.JWT_SIGN_SECRET_COMPAT;

function resolveSignSecrets() {
  const secrets = [JWT_SIGN_SECRET, JWT_SIGN_SECRET_COMPAT]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim());
  return [...new Set(secrets)];
}

function verifyWithAnySignSecret(token) {
  const secrets = resolveSignSecrets();
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      // Try next configured secret.
    }
  }
  return null;
}

module.exports = {
  generateTokenForUser: function (userData) {
    return jwt.sign({
        userId: userData.id,
        isAdmin: userData.isAdmin
      },
      JWT_SIGN_SECRET, {
        expiresIn: EXPIRE_SESSION
      })
  },
  generateExtendSessionToken: function (userData) {
    return jwt.sign({
        userId: userData.id,
        isAdmin: userData.isAdmin
      },
      JWT_SIGN_SECRET, {
        expiresIn: EXPIRE_EXTEND_SESSION
      }
    );
  },

  parseAuthorization: function (authorization) {
    return (authorization != null) ? authorization.replace('Bearer ', '') : null;
  },
  getUserId: function (authorization) {
    let userId = -1;
    const token = module.exports.parseAuthorization(authorization);
    if (token != null) {
      const jwtToken = verifyWithAnySignSecret(token);
      if (jwtToken != null)
        userId = jwtToken.userId;
    }
    return userId;
  },
  generateRefreshTokenForUser: function (userData) {
    return jwt.sign({
      userId: userData.id
    }, JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });
  },

  verifyRefreshToken: function (token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      return null;
    }
  },
  verifyAccessToken: function (token) {
    return verifyWithAnySignSecret(token);
  },
  decodeToken: function (token) {
    // const token = module.exports.parseAuthorization(authorization);
    if (token != null) {
      return verifyWithAnySignSecret(token); // renvoie { userId, isAdmin }
    }
    return null;
  }
};