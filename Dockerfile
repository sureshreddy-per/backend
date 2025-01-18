# Build stage
FROM node:18-alpine AS builder

# Add build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Create non-root user and set proper permissions
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    mkdir -p /app/node_modules && \
    chown -R appuser:appgroup /app

# Copy package files for better caching
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies with specific NODE_ENV
ENV NODE_ENV=development
RUN npm ci

# Copy source code
COPY . .
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache wget curl netcat-openbsd

WORKDIR /app

# Create non-root user and set proper permissions
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    mkdir -p /app/node_modules /app/uploads/produce/images /app/uploads/produce/videos /app/uploads/documents && \
    chown -R appuser:appgroup /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
ENV NODE_ENV=production
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy wait-for script
COPY scripts/wait-for.sh /usr/local/bin/wait-for
RUN chmod +x /usr/local/bin/wait-for

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

# Start the application with wait-for script
CMD ["sh", "-c", "wait-for ${DB_HOST}:${DB_PORT} -- node dist/main"] 