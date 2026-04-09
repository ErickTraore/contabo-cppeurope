process.env.NODE_ENV = 'development';

const app = require('./app');
const { sequelize, HomePageConfig } = require('./models');
const defaults = require('./routes/defaultHomeConfig');

const port = parseInt(process.env.PORT || '7020', 10);

sequelize
  .sync({ alter: true })
  .then(async () => {
    const n = await HomePageConfig.count({ where: { id: 1 } });
    if (n === 0) {
      await HomePageConfig.create(defaults);
      console.log('✅ home_page_configs : ligne par défaut créée (id=1)');
    }
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ HOME-CONFIG-BACKEND (dev) → http://0.0.0.0:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ HOME-CONFIG-BACKEND sync:', err);
    process.exit(1);
  });
