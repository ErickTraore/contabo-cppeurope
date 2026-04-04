// File: media-backend/config/config.js (lespremices)
const path = require('path');
const dotenv = require('dotenv');

// Charger le .env aligné sur NODE_ENV : ne pas importer .env.production en dev
// (sinon DB_NAME_MEDIA_DEV peut viser media_locale_prod_* alors que MariaDB dev n’a que *_dev_*).
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.join(__dirname, '..', `.env.${nodeEnv}`) });

module.exports = {
  development: {
    database: process.env.DB_NAME_MEDIA_DEV,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql'
  },
  test: {
    database: process.env.DB_NAME_MEDIA_TEST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql'
  },
   production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'mariadb',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mariadb',
    logging: false,
  },
};