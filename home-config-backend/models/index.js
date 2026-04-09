const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '..', 'config', 'config.js'))[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect || 'mariadb',
  logging: config.logging,
});

const HomePageConfig = require('./homePageConfig')(sequelize, DataTypes);

module.exports = { sequelize, HomePageConfig };
