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

# Copy root package.json for workspace resolution
COPY package*.json ./

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code and configuration
COPY turbo.json ./
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/prisma.config.ts ./packages/backend/
COPY packages/backend/package*.json ./packages/backend/

# Generate Prisma client BEFORE building TypeScript
WORKDIR /app/packages/backend
RUN npx prisma generate --schema=./prisma/schema.prisma

# Verify Prisma client was generated
RUN ls -la src/generated/prisma/

# Build TypeScript
WORKDIR /app/packages/backend
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Copy root package.json for workspace resolution
COPY package*.json ./

# Install production dependencies only
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci --workspace=awp-backend --only=production --ignore-scripts

# Copy Prisma schema and generate client in production (needed for runtime)
COPY packages/backend/prisma ./packages/backend/prisma
WORKDIR /app/packages/backend
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy built application
WORKDIR /app
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/src/generated ./packages/backend/src/generated

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
