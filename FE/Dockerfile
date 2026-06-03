# ==== Base builder image ====
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments and export them for Next.js build
ARG NEXT_PUBLIC_API_URL=__NEXT_PUBLIC_API_URL_PLACEHOLDER__
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

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
# Dynamically replace the API URL placeholder with the runtime env variable at startup
CMD sh -c "API_URL=\${NEXT_PUBLIC_API_URL:-http://localhost:9000/api} && find .next -type f \\( -name '*.js' -o -name '*.html' \\) -exec sed -i \"s|__NEXT_PUBLIC_API_URL_PLACEHOLDER__|\${API_URL}|g\" {} + && npx next start -p \${PORT:-3000}"

