// File : media-backend/models/index.js
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const env = process.env.NODE_ENV || 'development';

const configPath = path.join(__dirname, '..', 'config', 'config.js');
const config = require(configPath)[env];

console.log('🔍 ENV:', env);
console.log('🔍 Config:', config);
console.log('🔍 Database name:', config.database);

const sequelize = new Sequelize(
  config.database, 
  config.username, 
  config.password, 
  {
  host: config.host || 'mariadb',
  port: config.port || 3306,
  dialect: config.dialect || 'mariadb',
  logging: false,
});

// Import des modèles
const MediaPresseGle = require('./mediaPresseGle')(sequelize, DataTypes);

// Alias pour compatibilité (Media = MediaPresseGle)
const Media = MediaPresseGle;

// Définir les associations
if (MediaPresseGle.associate) MediaPresseGle.associate({ MediaProfile });

module.exports = {
  sequelize,
  Media,           // ✅ Alias pour compatibilité
  MediaPresseGle
};
