-- Add canonicalName column to produce_synonyms table
ALTER TABLE produce_synonyms ADD COLUMN IF NOT EXISTS "canonical_name" VARCHAR(255) NOT NULL;

-- Add is_active column to system_configs table
ALTER TABLE system_configs ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE; 