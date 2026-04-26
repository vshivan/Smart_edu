FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 10000
ENV PORT=10000
# Use 'start' not 'start:migrate' — migrations run safely inside src/index.js startup
CMD ["node", "src/index.js"]
