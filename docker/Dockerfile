# ============================================
# Prüfstand Dashboard - Multi-Stage Dockerfile
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Astro
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Install nginx and PM2
RUN apk add --no-cache nginx
RUN npm install -g pm2

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy config files
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/ecosystem.config.cjs ./ecosystem.config.cjs

# Create nginx directories
RUN mkdir -p /run/nginx

# Expose port
EXPOSE 80

# Start with PM2
CMD ["pm2-runtime", "ecosystem.config.cjs"]





