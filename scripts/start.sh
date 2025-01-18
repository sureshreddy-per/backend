#!/bin/sh

echo "Starting application initialization..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until node dist/scripts/wait-for-db.js; do
  echo "Database not ready, retrying in 5 seconds..."
  sleep 5
done

# Initialize database
echo "Initializing database..."
node dist/scripts/init-db.js

# Start the application
echo "Starting application..."
exec node dist/main.js 