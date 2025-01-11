-- Drop all tables, views, and types
DO $$ DECLARE
    r RECORD;
BEGIN
    -- Disable triggers
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL;';
    END LOOP;

    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;

    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE;';
    END LOOP;

    -- Drop all types (including enums)
    FOR r IN (
        SELECT t.typname
        FROM pg_type t
        LEFT JOIN pg_depend d ON d.objid = t.oid AND d.deptype = 'e'
        WHERE t.typnamespace = current_schema()::regnamespace
        AND d.objid IS NULL
        AND t.typtype = 'e'
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE;';
    END LOOP;
END $$; 