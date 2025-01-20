#!/bin/bash
set -e

echo "Starting database initialization..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing schema setup"

# Drop and recreate schema
psql "$DATABASE_URL" -c 'DROP SCHEMA IF EXISTS public CASCADE;'
psql "$DATABASE_URL" -c 'CREATE SCHEMA public;'

# Create extensions
echo "Creating extensions..."
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS "postgis";'
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS "pg_trgm";'

# Create trigger functions
echo "Creating trigger functions..."
psql "$DATABASE_URL" -c 'CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language plpgsql;'

# Verify UUID generation
echo "Verifying UUID generation..."
psql "$DATABASE_URL" -c 'SELECT uuid_generate_v4();'

# Run create_tables.sql
echo "Running create_tables.sql..."
psql "$DATABASE_URL" < create_tables.sql

echo "Database initialization completed successfully" 