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
RUN apk add --no-cache wget curl netcat-openbsd bash postgresql-client

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

# Copy built application and scripts
COPY --from=builder /app/dist ./dist
COPY scripts ./scripts

# Copy wait-for script
COPY scripts/wait-for.sh /usr/local/bin/wait-for
RUN chmod +x /usr/local/bin/wait-for

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Waiting for database..."\n\
wait-for ${DB_HOST}:${DB_PORT} -t 30\n\
\n\
echo "Running database initialization..."\n\
node dist/scripts/init-db.js\n\
\n\
echo "Starting application..."\n\
exec node dist/main' > /app/start.sh && \
    chmod +x /app/start.sh

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384"

# Expose port
EXPOSE 3000

# Add healthcheck with longer interval and timeout
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application with the startup script
CMD ["/app/start.sh"] 