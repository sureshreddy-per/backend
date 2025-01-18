#!/bin/bash

# Wait for database to be ready
node dist/scripts/wait-for-db.js

# Initialize database
node dist/scripts/init-db.js

# Start the application
exec node dist/src/main.js 