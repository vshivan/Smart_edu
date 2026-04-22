FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY payment-service/package*.json ./
RUN npm ci --only=production
COPY payment-service/ .
EXPOSE 3008
CMD ["node", "src/index.js"]
