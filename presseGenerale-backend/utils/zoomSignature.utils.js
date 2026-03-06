const jwt = require("jsonwebtoken");

function generateZoomSignature(meetingNumber, role, sdkKey, sdkSecret) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 2;

  const payload = {
    sdkKey,
    mn: meetingNumber,
    role: role,
    iat,
    exp,
    appKey: sdkKey,
    tokenExp: exp
  };

  return jwt.sign(payload, sdkSecret, { algorithm: "HS256" });
}

module.exports = { generateZoomSignature };
