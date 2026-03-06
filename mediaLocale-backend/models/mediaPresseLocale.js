const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MediaPresseLocale extends Model {}

    MediaPresseLocale.init({
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        messageId: { type: DataTypes.INTEGER, allowNull: false },
        filename: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
    }, {
        sequelize,
        modelName: 'MediaPresseLocale',
        tableName: 'MediaPresseGle',
        timestamps: true
    });

    return MediaPresseLocale;
};
