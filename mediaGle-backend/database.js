// File: ppcilyoncentre/media-backend/database.js

const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// 🔒 Charger uniquement .env.production si NODE_ENV=production
const envFile = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '.env.production')
  : path.join(__dirname, '.env');

dotenv.config({ path: envFile });

const env = process.env.NODE_ENV || 'development';
const dbConfig = require('./config/config.js')[env];

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME_MEDIA_PROD:', process.env.DB_NAME_MEDIA_PROD);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_DIALECT:', process.env.DB_DIALECT);

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

module.exports = sequelize;
