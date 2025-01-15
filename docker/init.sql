-- Initialize database schema
\i /docker-entrypoint-initdb.d/create_tables.sql
\i /docker-entrypoint-initdb.d/direct_to_db.sql 