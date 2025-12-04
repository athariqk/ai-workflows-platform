# Multi-stage build for production
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files from root and backend
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/typescript-config ./packages/typescript-config
COPY packages/vitest-config ./packages/vitest-config

# Install dependencies
RUN npm ci --workspace=awp-backend --workspace=@repo/typescript-config --workspace=@repo/vitest-config

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code and configuration
COPY turbo.json ./
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/prisma.config.ts ./packages/backend/

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci --workspace=awp-backend --only=production --ignore-scripts

# Copy built application
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/src/generated ./packages/backend/src/generated
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Set working directory to backend
WORKDIR /app/packages/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
