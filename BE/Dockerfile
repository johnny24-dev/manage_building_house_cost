# ==== Base builder image ====
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY tsconfig.json tsconfig.json
COPY src src

# Build TypeScript
RUN npm run build

# ==== Production image ====
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000

# Install system dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Create necessary directories with proper permissions
RUN mkdir -p /app/uploads /app/database && \
    chmod -R 755 /app/uploads /app/database

# Expose port (will be overridden by PORT env var)
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 9000) + '/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application (ensure database directory exists)
CMD sh -c "mkdir -p /app/database && node dist/index.js"

