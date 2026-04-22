FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY admin-service/package*.json ./
RUN npm ci --only=production
COPY admin-service/ .
EXPOSE 3011
CMD ["node", "src/index.js"]
