'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Renommer la table Media en MediaPresseGle
    await queryInterface.renameTable('Media', 'MediaPresseGle');
  },

  down: async (queryInterface, Sequelize) => {
    // Revenir en arrière : renommer MediaPresseGle en Media
    await queryInterface.renameTable('MediaPresseGle', 'Media');
  }
};
