# Multi-stage build for production
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/typescript-config ./packages/typescript-config

# Install dependencies
RUN npm ci --workspace=awp-frontend --workspace=@repo/typescript-config

# Build stage
FROM base AS builder
WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_BASE_URL=http://localhost:3000
ARG VITE_API_KEY

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code and configuration
COPY turbo.json ./
COPY packages/frontend ./packages/frontend

# Build application with environment variables
WORKDIR /app/packages/frontend
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
