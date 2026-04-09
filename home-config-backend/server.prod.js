process.env.NODE_ENV = 'production';

const app = require('./app');
const { sequelize, HomePageConfig } = require('./models');
const defaults = require('./routes/defaultHomeConfig');

const port = parseInt(process.env.PORT || '7020', 10);

sequelize
  .authenticate()
  .then(() => sequelize.sync({ alter: false }))
  .then(async () => {
    const n = await HomePageConfig.count({ where: { id: 1 } });
    if (n === 0) {
      await HomePageConfig.create(defaults);
      console.log('✅ home_page_configs : ligne par défaut créée (id=1)');
    }
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ HOME-CONFIG-BACKEND (prod) → port ${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ HOME-CONFIG-BACKEND prod:', err);
    process.exit(1);
  });
