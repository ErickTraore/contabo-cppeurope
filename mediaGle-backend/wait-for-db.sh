#!/bin/sh
set -e

HOST="${DB_HOST:-mariadb}"
PORT="${DB_PORT:-3306}"

echo "⏳ Attente de MariaDB sur $HOST:$PORT..."

until node -e "
  const net = require('net');
  const socket = net.createConnection({ host: '$HOST', port: $PORT }, () => {
    console.log('✅ MariaDB est accessible, démarrage de l\\'app (media-backend)...');
    socket.end();
  });
  socket.on('error', () => { process.exit(1); });
" >/dev/null 2>&1
do
  sleep 1
done

exec "$@"
EOF

chmod +x wait-for-db.sh