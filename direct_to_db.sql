-- Remove all migration records
DELETE FROM __EFMigrationsHistory; 

-- Drop existing tables if they exist
DROP TABLE IF EXISTS AspNetUserTokens;
DROP TABLE IF EXISTS AspNetUserRoles;
DROP TABLE IF EXISTS AspNetUserLogins;
DROP TABLE IF EXISTS AspNetUserClaims;
DROP TABLE IF EXISTS AspNetRoleClaims;
DROP TABLE IF EXISTS AspNetUsers;
DROP TABLE IF EXISTS AspNetRoles;
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Conversations;

-- Create tables with their final schema
CREATE TABLE AspNetRoles (
    Id nvarchar(450) NOT NULL,
    Name nvarchar(256) NULL,
    NormalizedName nvarchar(256) NULL,
    ConcurrencyStamp nvarchar(max) NULL,
    CONSTRAINT PK_AspNetRoles PRIMARY KEY (Id)
);

CREATE TABLE AspNetUsers (
    Id nvarchar(450) NOT NULL,
    UserName nvarchar(256) NULL,
    NormalizedUserName nvarchar(256) NULL,
    Email nvarchar(256) NULL,
    NormalizedEmail nvarchar(256) NULL,
    EmailConfirmed bit NOT NULL,
    PasswordHash nvarchar(max) NULL,
    SecurityStamp nvarchar(max) NULL,
    ConcurrencyStamp nvarchar(max) NULL,
    PhoneNumber nvarchar(max) NULL,
    PhoneNumberConfirmed bit NOT NULL,
    TwoFactorEnabled bit NOT NULL,
    LockoutEnd datetimeoffset NULL,
    LockoutEnabled bit NOT NULL,
    AccessFailedCount int NOT NULL,
    CONSTRAINT PK_AspNetUsers PRIMARY KEY (Id)
);

CREATE TABLE Conversations (
    Id uniqueidentifier NOT NULL,
    UserId nvarchar(450) NOT NULL,
    Title nvarchar(max) NULL,
    CreatedAt datetime2 NOT NULL,
    UpdatedAt datetime2 NOT NULL,
    CONSTRAINT PK_Conversations PRIMARY KEY (Id),
    CONSTRAINT FK_Conversations_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
);

CREATE TABLE Messages (
    Id uniqueidentifier NOT NULL,
    ConversationId uniqueidentifier NOT NULL,
    Role nvarchar(max) NOT NULL,
    Content nvarchar(max) NOT NULL,
    CreatedAt datetime2 NOT NULL,
    CONSTRAINT PK_Messages PRIMARY KEY (Id),
    CONSTRAINT FK_Messages_Conversations_ConversationId FOREIGN KEY (ConversationId) REFERENCES Conversations (Id) ON DELETE CASCADE
);

CREATE TABLE AspNetRoleClaims (
    Id int IDENTITY(1,1) NOT NULL,
    RoleId nvarchar(450) NOT NULL,
    ClaimType nvarchar(max) NULL,
    ClaimValue nvarchar(max) NULL,
    CONSTRAINT PK_AspNetRoleClaims PRIMARY KEY (Id),
    CONSTRAINT FK_AspNetRoleClaims_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserClaims (
    Id int IDENTITY(1,1) NOT NULL,
    UserId nvarchar(450) NOT NULL,
    ClaimType nvarchar(max) NULL,
    ClaimValue nvarchar(max) NULL,
    CONSTRAINT PK_AspNetUserClaims PRIMARY KEY (Id),
    CONSTRAINT FK_AspNetUserClaims_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserLogins (
    LoginProvider nvarchar(450) NOT NULL,
    ProviderKey nvarchar(450) NOT NULL,
    ProviderDisplayName nvarchar(max) NULL,
    UserId nvarchar(450) NOT NULL,
    CONSTRAINT PK_AspNetUserLogins PRIMARY KEY (LoginProvider, ProviderKey),
    CONSTRAINT FK_AspNetUserLogins_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserRoles (
    UserId nvarchar(450) NOT NULL,
    RoleId nvarchar(450) NOT NULL,
    CONSTRAINT PK_AspNetUserRoles PRIMARY KEY (UserId, RoleId),
    CONSTRAINT FK_AspNetUserRoles_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id) ON DELETE CASCADE,
    CONSTRAINT FK_AspNetUserRoles_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserTokens (
    UserId nvarchar(450) NOT NULL,
    LoginProvider nvarchar(450) NOT NULL,
    Name nvarchar(450) NOT NULL,
    Value nvarchar(max) NULL,
    CONSTRAINT PK_AspNetUserTokens PRIMARY KEY (UserId, LoginProvider, Name),
    CONSTRAINT FK_AspNetUserTokens_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IX_AspNetRoleClaims_RoleId ON AspNetRoleClaims (RoleId);
CREATE UNIQUE INDEX RoleNameIndex ON AspNetRoles (NormalizedName) WHERE NormalizedName IS NOT NULL;
CREATE INDEX IX_AspNetUserClaims_UserId ON AspNetUserClaims (UserId);
CREATE INDEX IX_AspNetUserLogins_UserId ON AspNetUserLogins (UserId);
CREATE INDEX IX_AspNetUserRoles_RoleId ON AspNetUserRoles (RoleId);
CREATE INDEX EmailIndex ON AspNetUsers (NormalizedEmail);
CREATE UNIQUE INDEX UserNameIndex ON AspNetUsers (NormalizedUserName) WHERE NormalizedUserName IS NOT NULL;
CREATE INDEX IX_Conversations_UserId ON Conversations (UserId);
CREATE INDEX IX_Messages_ConversationId ON Messages (ConversationId);

-- Add bank_details table
CREATE TABLE bank_details (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name varchar NOT NULL,
    account_number varchar NOT NULL,
    bank_name varchar NOT NULL,
    branch_code varchar NOT NULL,
    farmer_id uuid NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_details_farmer 
        FOREIGN KEY (farmer_id) 
        REFERENCES farmers(id) 
        ON DELETE CASCADE
);

-- Handle duplicate farmer records and add unique constraint
-- First update related records to point to the oldest farmer record
WITH duplicates AS (
    SELECT user_id, array_agg(id ORDER BY created_at) as farmer_ids
    FROM farmers
    GROUP BY user_id
    HAVING COUNT(*) > 1
)
UPDATE bank_details
SET farmer_id = duplicates.farmer_ids[1]
FROM duplicates
WHERE farmer_id = ANY(duplicates.farmer_ids[2:]);

WITH duplicates AS (
    SELECT user_id, array_agg(id ORDER BY created_at) as farmer_ids
    FROM farmers
    GROUP BY user_id
    HAVING COUNT(*) > 1
)
UPDATE farm_details
SET farmer_id = duplicates.farmer_ids[1]
FROM duplicates
WHERE farmer_id = ANY(duplicates.farmer_ids[2:]);

WITH duplicates AS (
    SELECT user_id, array_agg(id ORDER BY created_at) as farmer_ids
    FROM farmers
    GROUP BY user_id
    HAVING COUNT(*) > 1
)
UPDATE produces
SET farmer_id = duplicates.farmer_ids[1]
FROM duplicates
WHERE farmer_id = ANY(duplicates.farmer_ids[2:]);

-- Delete duplicate farmer records, keeping the oldest one
DELETE FROM farmers a
USING (
    SELECT user_id, MIN(created_at) as min_created_at
    FROM farmers
    GROUP BY user_id
    HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id
AND a.created_at > b.min_created_at;

-- Add unique constraint on farmers.user_id
ALTER TABLE farmers
ADD CONSTRAINT "UQ_farmers_user_id" UNIQUE ("user_id"); 

-- Add this update query
CREATE OR REPLACE FUNCTION update_farmer(
    p_farmer_id INTEGER,
    p_name VARCHAR,
    p_phone VARCHAR,
    p_address TEXT,
    p_updated_by INTEGER
)
RETURNS TABLE (
    farmer_id INTEGER,
    name VARCHAR,
    phone VARCHAR,
    address TEXT,
    updated_at TIMESTAMP,
    updated_by INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE farmers
    SET 
        name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        address = COALESCE(p_address, address),
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_farmer_id
    RETURNING 
        id as farmer_id,
        name,
        phone,
        address,
        updated_at,
        updated_by;
END;
$$ LANGUAGE plpgsql; 

-- Create produce_category enum
DROP TYPE IF EXISTS produce_category_enum CASCADE;
CREATE TYPE produce_category_enum AS ENUM (
  'FOOD_GRAINS',
  'OILSEEDS',
  'FRUITS',
  'VEGETABLES',
  'SPICES',
  'FIBERS',
  'SUGARCANE',
  'FLOWERS',
  'MEDICINAL_AND_AROMATIC_PLANTS'
);

-- Create produce_status enum
DROP TYPE IF EXISTS produce_status_enum CASCADE;
CREATE TYPE produce_status_enum AS ENUM (
  'available',
  'sold',
  'reserved',
  'expired',
  'removed'
);

-- Create produce table
DROP TABLE IF EXISTS produce CASCADE;
CREATE TABLE produce (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name varchar NOT NULL,
  produce_category produce_category_enum NOT NULL,
  price_per_unit decimal(10,2) NOT NULL,
  unit varchar NOT NULL,
  available_quantity decimal(10,2) NOT NULL,
  description varchar,
  images text,
  produce_tag varchar,
  status produce_status_enum NOT NULL DEFAULT 'available',
  quality_grade varchar,
  farmer_id uuid NOT NULL,
  farm_id uuid,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pk_produce PRIMARY KEY (id),
  CONSTRAINT fk_produce_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_produce_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
);

-- Create indexes for produce table
CREATE INDEX idx_produce_farmer_id ON produce(farmer_id);
CREATE INDEX idx_produce_farm_id ON produce(farm_id);
CREATE INDEX idx_produce_status ON produce(status);
CREATE INDEX idx_produce_category ON produce(produce_category);

-- Create synonyms table
DROP TABLE IF EXISTS synonyms CASCADE;
CREATE TABLE synonyms (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name varchar NOT NULL,
  words text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pk_synonyms PRIMARY KEY (id),
  CONSTRAINT uq_synonyms_name UNIQUE (name)
); 

-- Create quality_grade enum if it doesn't exist
DROP TYPE IF EXISTS quality_grade_enum CASCADE;
CREATE TYPE quality_grade_enum AS ENUM (
  'GRADE_10', 'GRADE_9', 'GRADE_8', 'GRADE_7', 'GRADE_6', 'GRADE_5', 'GRADE_4', 'GRADE_3', 'GRADE_2', 'GRADE_1', 'PENDING', 'REJECTED'
);

-- Create quality_assessments table
DROP TABLE IF EXISTS quality_assessments CASCADE;
CREATE TABLE quality_assessments (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  produce_id uuid NOT NULL,
  grade quality_grade_enum NOT NULL DEFAULT 'PENDING',
  criteria jsonb NOT NULL CHECK (
    jsonb_typeof(criteria) = 'object' AND
    (criteria->>'category') IS NOT NULL AND
    CASE criteria->>'category'
      WHEN 'FOOD_GRAINS' THEN
        (criteria->>'moistureContent') IS NOT NULL AND
        (criteria->>'foreignMatter') IS NOT NULL AND
        (criteria->>'variety') IS NOT NULL
      WHEN 'FRUITS' THEN
        (criteria->>'sweetness') IS NOT NULL AND
        (criteria->>'size') IS NOT NULL AND
        (criteria->>'color') IS NOT NULL AND
        (criteria->>'ripenessLevel') IS NOT NULL
      WHEN 'VEGETABLES' THEN
        (criteria->>'freshness') IS NOT NULL AND
        (criteria->>'color') IS NOT NULL AND
        (criteria->>'firmness') IS NOT NULL AND
        (criteria->>'size') IS NOT NULL
      WHEN 'SPICES' THEN
        (criteria->>'aroma') IS NOT NULL AND
        (criteria->>'pungency') IS NOT NULL AND
        (criteria->>'moisture') IS NOT NULL
      WHEN 'OILSEEDS' THEN
        (criteria->>'oilContent') IS NOT NULL AND
        (criteria->>'moistureContent') IS NOT NULL AND
        (criteria->>'foreignMatter') IS NOT NULL AND
        (criteria->>'maturity') IS NOT NULL
      WHEN 'FIBERS' THEN
        (criteria->>'length') IS NOT NULL AND
        (criteria->>'strength') IS NOT NULL AND
        (criteria->>'fineness') IS NOT NULL AND
        (criteria->>'maturity') IS NOT NULL
      WHEN 'SUGARCANE' THEN
        (criteria->>'sugarContent') IS NOT NULL AND
        (criteria->>'juiceContent') IS NOT NULL AND
        (criteria->>'purity') IS NOT NULL AND
        (criteria->>'maturity') IS NOT NULL
      WHEN 'FLOWERS' THEN
        (criteria->>'freshness') IS NOT NULL AND
        (criteria->>'color') IS NOT NULL AND
        (criteria->>'bloomStage') IS NOT NULL AND
        (criteria->>'stemLength') IS NOT NULL
      WHEN 'MEDICINAL_AND_AROMATIC_PLANTS' THEN
        (criteria->>'activeIngredientContent') IS NOT NULL AND
        (criteria->>'purity') IS NOT NULL AND
        (criteria->>'moisture') IS NOT NULL AND
        (criteria->>'authenticity') IS NOT NULL
      ELSE false
    END
  ),
  inspector_id uuid,
  images text[],
  assessed_at timestamp,
  notes text,
  estimated_shelf_life varchar,
  suggested_price decimal(10,2),
  is_primary boolean DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pk_quality_assessments PRIMARY KEY (id),
  CONSTRAINT fk_quality_assessments_produce FOREIGN KEY (produce_id) 
    REFERENCES produce(id) ON DELETE CASCADE,
  CONSTRAINT fk_quality_assessments_inspector FOREIGN KEY (inspector_id) 
    REFERENCES inspectors(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_quality_assessments_produce_id ON quality_assessments(produce_id);
CREATE INDEX idx_quality_assessments_inspector_id ON quality_assessments(inspector_id);
CREATE INDEX idx_quality_assessments_grade ON quality_assessments(grade);
CREATE INDEX idx_quality_assessments_assessed_at ON quality_assessments(assessed_at);

-- Add constraint to ensure only one primary assessment per produce
CREATE UNIQUE INDEX idx_quality_assessments_primary 
ON quality_assessments(produce_id) 
WHERE is_primary = true;

-- Create GIN index for efficient JSON search
CREATE INDEX idx_quality_assessments_criteria ON quality_assessments USING gin (criteria); 