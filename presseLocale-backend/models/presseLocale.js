// File: presseLocale-backend/models/presseLocale.js

module.exports = (sequelize, DataTypes) => {
  const PresseLocale = sequelize.define('PresseLocale', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        len: [1, 50000]
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    categ: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'presse-locale'
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    siteKey: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'PresseLocale'
  });

  return PresseLocale;
};
