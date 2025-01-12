-- Fix column type for report table
ALTER TABLE report ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Fix column type for request_metrics table
ALTER TABLE request_metrics ALTER COLUMN user_id TYPE uuid USING user_id::uuid; 