// File: media-backend/models/mediaPresseGle.js

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MediaPresseGle extends Model {}

    MediaPresseGle.init({
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        messageId: { type: DataTypes.INTEGER, allowNull: false },
        filename: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
    }, {
        sequelize,
        modelName: 'MediaPresseGle',
        tableName: 'MediaPresseGle',
        timestamps: true
    });

    return MediaPresseGle;
};
