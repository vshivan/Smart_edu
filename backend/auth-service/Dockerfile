FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY auth-service/package*.json ./
RUN npm ci --only=production
COPY auth-service/ .
EXPOSE 3001
CMD ["node", "src/index.js"]
