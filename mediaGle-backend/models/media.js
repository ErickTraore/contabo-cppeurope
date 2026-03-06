// File: media-backend/models/media.js

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Media extends Model {}

    Media.init({
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        messageId: { type: DataTypes.INTEGER, allowNull: false },
        filename: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
      
    }, {
        sequelize,
        modelName: 'Media',
        tableName: 'Media',
        timestamps: true
    });

    return Media;
};
