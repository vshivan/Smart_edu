FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY course-service/package*.json ./
RUN npm ci --only=production
COPY course-service/ .
EXPOSE 3003
CMD ["node", "src/index.js"]
