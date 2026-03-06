// File: user-backend/server.test.js

const dotenv = require('dotenv');
// Charger le bon fichier .env selon NODE_ENV (ici .env.test)
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = require('./app');
const { sequelize } = require('./models');

console.log('⏳ Tentative de connexion à la base de données (test)...');

sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ USER-BACKEND connecté à la BDD (test)');
    // ⚠️ Pas de démarrage de serveur en mode test
    module.exports = { app, sequelize };
  })
  .catch(err => {
    console.error('❌ Erreur de connexion USER-BACKEND (test):', err.message);
    module.exports = { app, sequelize };
  });
