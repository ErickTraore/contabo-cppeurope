const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
dotenv.config({ path: path.join(__dirname, '.env.production') });

const BASE_ORIGIN = process.env.REACT_APP_URL;
const allowedOrigins = [BASE_ORIGIN, BASE_ORIGIN && BASE_ORIGIN.replace('://', '://www.')].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const MAX_UPLOAD = process.env.UPLOAD_LIMIT_MB ? `${process.env.UPLOAD_LIMIT_MB}mb` : '600mb';
app.use(express.json({ limit: MAX_UPLOAD }));
app.use(express.urlencoded({ extended: true, limit: MAX_UPLOAD }));

app.use('/imagesprofile', express.static(path.join(__dirname, 'uploads/imagesprofile')));
app.use('/mediaprofile', express.static(path.join(__dirname, 'public/mediaprofile')));
app.use('/api/user-media-profile/mediaprofile', express.static(path.join(__dirname, 'public/mediaprofile')));

const apiRouter = require('./apiRouter').router;
app.use('/api/user-media-profile', apiRouter);

module.exports = app;
