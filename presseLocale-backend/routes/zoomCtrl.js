// File: stack-zoom/user-backend/routes/zoomCtrl.js


const { generateZoomSignature } = require('../utils/zoomSignature.utils');
require('dotenv').config();

exports.getSignature = (req, res) => {
  const meetingNumber = req.query.meetingNumber;
  const role = req.query.role || 0;

  if (!meetingNumber) {
    return res.status(400).json({ error: 'Meeting Number requis' });
  }

  const signature = generateZoomSignature(
    meetingNumber,
    role,
    process.env.ZOOM_SDK_KEY,
    process.env.ZOOM_SDK_SECRET
  );

  res.status(200).json({ signature });
};
