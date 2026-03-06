// File: media-backend/server.dev.js

const dotenv = require('dotenv');
// Charger le bon fichier .env selon NODE_ENV (ici .env.development)
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = require('./app');
const sequelize = require('./database');

const port = process.env.PORT || 5002;

console.log('⏳ Tentative de connexion MEDIA-BACKEND (dev)...');

sequelize.sync({ force: false })
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ MEDIA-BACKEND lancé en HTTP sur le port ${port} (development)`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MEDIA-BACKEND (dev):', err.message);
  });
