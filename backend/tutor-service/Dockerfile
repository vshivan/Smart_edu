FROM node:20-alpine
WORKDIR /app
COPY shared/ ./shared/
COPY tutor-service/package*.json ./
RUN npm ci --only=production
COPY tutor-service/ .
EXPOSE 3007
CMD ["node", "src/index.js"]
