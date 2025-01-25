DO $$ DECLARE r RECORD; BEGIN EXECUTE 'SET CONSTRAINTS ALL DEFERRED'; FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; FOR r IN (SELECT t.typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname) LOOP EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE'; END LOOP; FOR r IN (
    SELECT ns.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args 
    FROM pg_proc p 
    JOIN pg_namespace ns ON ns.oid = p.pronamespace 
    WHERE ns.nspname = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_extension e ON d.refobjid = e.oid
        WHERE d.objid = p.oid
    )
) LOOP EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE'; END LOOP; FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE'; END LOOP; END $$;
