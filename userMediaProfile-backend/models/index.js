const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, '..', 'config', 'config.js');
const config = require(configPath)[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host || 'medialocale-db',
  port: config.port || 3306,
  dialect: config.dialect || 'mariadb',
  logging: false,
});

const MediaProfile = require('./mediaProfile')(sequelize, DataTypes);

module.exports = {
  sequelize,
  MediaProfile,
};
