const jwt = require('jsonwebtoken');
const JWT_SIGN_SECRET = process.env.JWT_SIGN_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

module.exports = {
  decodeToken(token) {
    if (token == null) return null;
    try {
      return jwt.verify(token, JWT_SIGN_SECRET);
    } catch {
      return null;
    }
  },
};
