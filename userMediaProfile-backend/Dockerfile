# Dockerfile pour userMediaProfile-backend (Node.js/Express)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 7007
CMD ["sh", "-c", "npm install && NODE_ENV=development node server.dev.js"]
