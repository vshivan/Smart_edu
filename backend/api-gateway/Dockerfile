FROM node:20-alpine
WORKDIR /app
# shared is available because build context = backend/
COPY shared/ ./shared/
COPY api-gateway/package*.json ./
RUN npm ci --only=production
COPY api-gateway/ .
EXPOSE 3000
CMD ["node", "src/index.js"]
