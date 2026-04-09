module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'HomePageConfig',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
      },
      heroText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'hero_text',
      },
      cat1Label: { type: DataTypes.STRING(255), allowNull: false, field: 'cat1_label' },
      cat1ImageUrl: { type: DataTypes.STRING(2048), allowNull: false, field: 'cat1_image_url' },
      cat2Label: { type: DataTypes.STRING(255), allowNull: false, field: 'cat2_label' },
      cat2ImageUrl: { type: DataTypes.STRING(2048), allowNull: false, field: 'cat2_image_url' },
      cat3Label: { type: DataTypes.STRING(255), allowNull: false, field: 'cat3_label' },
      cat3ImageUrl: { type: DataTypes.STRING(2048), allowNull: false, field: 'cat3_image_url' },
    },
    {
      tableName: 'home_page_configs',
      timestamps: true,
      underscored: true,
    }
  );
};
