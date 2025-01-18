# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm to use more reliable settings
RUN npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

# Install dependencies with legacy peer deps to handle deprecation warnings
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm for production
RUN npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

# Install production dependencies only with legacy peer deps
RUN npm ci --only=production --legacy-peer-deps

# Copy built application and scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/create_tables.sql ./
COPY scripts/start.sh ./

# Make startup script executable
RUN chmod +x ./start.sh

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["./start.sh"]