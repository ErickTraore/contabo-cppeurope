// File: media-backend/models/mediaProfile.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const MediaProfile = sequelize.define('MediaProfile', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        profileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        slot: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '0 = avatar, 1 = photo 1, 2 = photo 2, 3 = photo 3',
        },
    },
        {
            timestamps: true,
            tableName: 'MediaProfile',
        });

    MediaProfile.associate = () => { };


    return MediaProfile;
};
