# ==== Base builder image ====
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# ==== Production image ====
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js* ./

# Install production dependencies (including typescript for next.config if needed)
# But we use .js now so no need for typescript
RUN npm ci --omit=dev --legacy-peer-deps

# Expose port (will be overridden by PORT env var)
EXPOSE 3000

# Start Next.js using npx (which will find next in node_modules/.bin)
CMD sh -c "npx next start -p ${PORT:-3000}"

