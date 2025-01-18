-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension if needed
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_trgm for text search operations
CREATE EXTENSION IF NOT EXISTS pg_trgm; 