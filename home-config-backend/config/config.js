const common = {
  username: process.env.DB_USERNAME || 'c',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'home_config_dev_cppeurope_v1',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mariadb',
  logging: false,
};

module.exports = {
  development: { ...common },
  production: { ...common },
};
