FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY notification-service/package*.json ./
RUN npm ci --only=production
COPY notification-service/ .
EXPOSE 3010
CMD ["node", "src/index.js"]
