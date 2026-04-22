FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY gamification-service/package*.json ./
RUN npm ci --only=production
COPY gamification-service/ .
EXPOSE 3006
CMD ["node", "src/index.js"]
