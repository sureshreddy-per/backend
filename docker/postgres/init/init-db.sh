#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE USER admin WITH PASSWORD 'admin123' CREATEDB;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER USER admin WITH SUPERUSER;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE agrimarket;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON DATABASE agrimarket TO admin;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "agrimarket" -c "ALTER DATABASE agrimarket OWNER TO admin;" 