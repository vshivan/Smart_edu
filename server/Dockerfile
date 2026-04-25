FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init wget

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy application source
COPY src/ ./src/

# Create logs directory with correct ownership
RUN mkdir -p logs && chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
