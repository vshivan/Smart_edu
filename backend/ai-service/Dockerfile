FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY ai-service/package*.json ./
RUN npm ci --only=production
COPY ai-service/ .
EXPOSE 3004
CMD ["node", "src/index.js"]
