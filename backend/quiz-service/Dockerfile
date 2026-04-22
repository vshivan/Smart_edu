FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY quiz-service/package*.json ./
RUN npm ci --only=production
COPY quiz-service/ .
EXPOSE 3005
CMD ["node", "src/index.js"]
