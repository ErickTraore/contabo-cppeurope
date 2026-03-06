// File: media-backend/server.test.js

const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = require('./app');
const sequelize = require('./database');

console.log('⏳ Tentative de connexion à la base de données (test)...');
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ MEDIA-BACKEND connecté à la BDD (test)');
    // Pas d’écoute de port en mode test.
    module.exports = { app, sequelize };
  })
  .catch(err => {
    console.error('❌ Erreur de connexion de MEDIA-BACKEND (test):', err.message);
    module.exports = { app, sequelize };
  });
