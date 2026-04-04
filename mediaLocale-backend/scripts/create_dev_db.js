// Script Node.js pour créer la base et une table de test en dev
const mariadb = require('mariadb');


const config = {
  host: '127.0.0.1',
  port: 3309, // Port exposé par le conteneur mariadb dev
  user: 'medialocale',
  password: 'medialocale',
  multipleStatements: true
};

const dbName = 'media_locale_dev_cppeurope_v1';
const user = 'c';
const userPassword = 'CppEurope@2025!';

async function main() {
  let conn;
  try {
    conn = await mariadb.createConnection(config);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await conn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${user}'@'%';`);
    await conn.query('FLUSH PRIVILEGES;');
    await conn.query(`USE \`${dbName}\`; CREATE TABLE IF NOT EXISTS test_table (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255));`);
    console.log('✅ Base et table créées/configurées avec succès.');
  } catch (err) {
    console.error('Erreur SQL:', err);
    process.exit(1);
  } finally {
    if (conn) conn.end();
  }
}

main();
