'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PresseLocale', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT('long'),
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      categ: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'presse-locale'
      },
      attachment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      siteKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PresseLocale');
  }
};
