// File : media-backend/server.prod.js
const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');
const { sequelize } = require('./models');

// Charger .env.production
dotenv.config({ path: path.join(__dirname, '.env.production') });


sequelize.sync({ alter: true })   // ou .sync() si tu préfères
  .then(() => {
    console.log('✅ DB synchronisée (media-backend)');
    const port = process.env.PORT || 7008;
    app.listen(port, () => {
      console.log(`🚀 media-backend en écoute sur le port ${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de synchronisation DB (media-backend):', err);
  });