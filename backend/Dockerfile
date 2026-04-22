# ════════════════════════════════════════════════════════════════════════════
# SmartEduLearn — Single Dockerfile for all backend services
#
# Usage:
#   docker build --build-arg SERVICE=auth-service -t sel-auth .
#   docker build --build-arg SERVICE=ai-service   -t sel-ai   .
#
# Or via docker-compose (SERVICE is passed automatically)
# ════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine

# Which service to build — passed at build time
ARG SERVICE
ENV SERVICE=${SERVICE}

WORKDIR /app

# Copy shared utilities (available to all services via ../../shared)
COPY shared/ ./shared/

# Copy only the target service's package files first (better layer caching)
# npm install only re-runs when package.json changes, not on every code change
COPY ${SERVICE}/package*.json ./

RUN npm ci --only=production

# Copy the rest of the service source
COPY ${SERVICE}/ .

# Expose a placeholder — actual port set per-service in docker-compose
EXPOSE 3000

# Start the service
CMD ["node", "src/index.js"]
