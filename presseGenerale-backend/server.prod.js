// File: user-backend/server.prod.js
const app = require('./app');
const { sequelize } = require('./models');



const port = process.env.PORT || 7006;

console.log('⏳ Tentative de connexion PRESSE-GENERALE-BACKEND (prod)...');
console.log(`🌍 NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`🛢️ DB cible = ${process.env.DB_NAME} (host: ${process.env.DB_HOST}, user: ${process.env.DB_USERNAME})`);

sequelize
  .authenticate()
  .then(() => {
    console.log(`✅ Connexion PRESSE-GENERALE-BACKEND à la BDD réussie (base: ${process.env.DB_NAME})`);
    app.listen(port, () => {
      console.log(`✅ PRESSE-GENERALE-BACKEND (prod) lancé en HTTP sur le port ${port}`);
    });
  })
  .catch((err) => {
    console.error(`❌ Erreur de connexion / synchronisation PRESSE-GENERALE-BACKEND (prod, base: ${process.env.DB_NAME}) :`, err.message);
    process.exit(1);
  });