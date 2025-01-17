# Build stage
FROM node:18-alpine AS builder

# Add build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy package files for better caching
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup tsconfig*.json ./
COPY --chown=appuser:appgroup package-lock.json ./

# Install dependencies with specific NODE_ENV
ENV NODE_ENV=development
RUN npm ci

# Copy source code
COPY --chown=appuser:appgroup . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create necessary directories with proper permissions
RUN mkdir -p uploads/produce/images uploads/produce/videos uploads/documents && \
    chown -R appuser:appgroup /app

# Copy package files
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup package-lock.json ./

# Install production dependencies only
ENV NODE_ENV=production
RUN npm ci --only=production

# Copy built application
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

# Copy production configuration
COPY --chown=appuser:appgroup --from=builder /app/src/config/production.config.ts ./dist/config/

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384"

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "dist/main"] 