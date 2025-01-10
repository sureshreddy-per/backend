-- Drop existing tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS produce CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS produce_synonyms CASCADE;
DROP TABLE IF EXISTS quality_assessments CASCADE;
DROP TABLE IF EXISTS inspection_base_fees CASCADE;
DROP TABLE IF EXISTS inspection_distance_fees CASCADE;
DROP TABLE IF EXISTS inspection_requests CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS buyer_preferences CASCADE;

-- Drop ALL existing enums
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS user_status_enum CASCADE;
DROP TYPE IF EXISTS produce_category_enum CASCADE;
DROP TYPE IF EXISTS produce_status_enum CASCADE;
DROP TYPE IF EXISTS quality_grade_enum CASCADE;
DROP TYPE IF EXISTS assessment_source_enum CASCADE;
DROP TYPE IF EXISTS admin_action_type_enum CASCADE;
DROP TYPE IF EXISTS offers_status_enum CASCADE;
DROP TYPE IF EXISTS transactions_status_enum CASCADE;

-- Create enum types
CREATE TYPE user_role_enum AS ENUM (
  'ADMIN',
  'FARMER',
  'BUYER',
  'INSPECTOR'
);

CREATE TYPE user_status_enum AS ENUM (
  'PENDING_VERIFICATION',
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
  'DELETED'
);

CREATE TYPE produce_category_enum AS ENUM (
  'FOOD_GRAINS',
  'OILSEEDS',
  'FRUITS',
  'VEGETABLES',
  'SPICES',
  'FIBERS',
  'SUGARCANE',
  'FLOWERS',
  'MEDICINAL_PLANTS'
);

CREATE TYPE produce_status_enum AS ENUM (
  'AVAILABLE',
  'PENDING_INSPECTION',
  'REJECTED',
  'IN_PROGRESS',
  'SOLD',
  'CANCELLED'
);

CREATE TYPE quality_grade_enum AS ENUM (
  'GRADE_10', 'GRADE_9', 'GRADE_8', 'GRADE_7', 'GRADE_6', 'GRADE_5', 'GRADE_4', 'GRADE_3', 'GRADE_2', 'GRADE_1', 'PENDING', 'REJECTED'
);

CREATE TYPE assessment_source_enum AS ENUM (
  'AI',
  'MANUAL_INSPECTION'
);

CREATE TYPE admin_action_type_enum AS ENUM (
  'USER_BLOCK',
  'USER_UNBLOCK',
  'USER_DELETE',
  'PRODUCE_DELETE',
  'PRODUCE_UPDATE',
  'OFFER_CANCEL',
  'TRANSACTION_CANCEL',
  'INSPECTION_ASSIGN',
  'SYSTEM_CONFIG_UPDATE'
);

CREATE TYPE offers_status_enum AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE transactions_status_enum AS ENUM (
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'FAILED'
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  mobile_number VARCHAR(20) UNIQUE NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'BUYER',
  status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
  block_reason TEXT,
  fcm_token TEXT,
  avatar_url TEXT,
  login_attempts INTEGER DEFAULT 0 NOT NULL,
  last_login_at TIMESTAMP,
  scheduled_for_deletion_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create farmers table
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create farms table
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  name VARCHAR(255) NOT NULL,
  size NUMERIC NOT NULL,
  address VARCHAR(255) NOT NULL,
  lat_lng VARCHAR(255),
  image VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create produce table
CREATE TABLE produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  farm_id UUID REFERENCES farms(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  product_variety VARCHAR(255),
  produce_category produce_category_enum NOT NULL,
  quantity DECIMAL NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  location TEXT,
  location_name VARCHAR(255),
  inspection_fee DECIMAL(10,2),
  is_inspection_requested BOOLEAN DEFAULT FALSE,
  inspection_requested_by UUID,
  inspection_requested_at TIMESTAMP,
  images TEXT[],
  status produce_status_enum NOT NULL DEFAULT 'AVAILABLE',
  harvested_at TIMESTAMP,
  expiry_date TIMESTAMP,
  quality_grade quality_grade_enum,
  video_url VARCHAR(255),
  assigned_inspector UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create produce_synonyms table
CREATE TABLE produce_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name VARCHAR(255) NOT NULL,
  words JSONB NOT NULL,
  translations JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create quality_assessments table
CREATE TABLE quality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id),
  source assessment_source_enum NOT NULL DEFAULT 'AI',
  quality_grade quality_grade_enum NOT NULL,
  confidence_level DECIMAL(5,2) NOT NULL,
  defects TEXT[],
  recommendations TEXT[],
  description TEXT,
  category_specific_assessment JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create inspection_base_fees table
CREATE TABLE inspection_base_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_category produce_category_enum NOT NULL,
  base_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create inspection_distance_fees table
CREATE TABLE inspection_distance_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_distance INTEGER NOT NULL,
  max_distance INTEGER NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create inspection_requests table
CREATE TABLE inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  inspector_id UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  inspection_fee DECIMAL(10,2) NOT NULL,
  inspection_result JSONB,
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_audit_logs table
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action admin_action_type_enum NOT NULL,
  entity_id UUID,
  entity_type VARCHAR(50),
  details JSONB NOT NULL,
  ip_address VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create system_config table
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create buyers table
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  gst VARCHAR(255),
  business_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(255),
  lat_lng VARCHAR(255),
  location_name VARCHAR(255),
  address VARCHAR(255) NOT NULL,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  categories produce_category_enum[],
  notification_enabled BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  price_per_unit DECIMAL(10,2) NOT NULL,
  quantity DECIMAL NOT NULL,
  status offers_status_enum NOT NULL DEFAULT 'PENDING',
  valid_until TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id),
  produce_id UUID NOT NULL REFERENCES produce(id),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  amount DECIMAL(10,2) NOT NULL,
  quantity DECIMAL NOT NULL,
  status transactions_status_enum NOT NULL DEFAULT 'PENDING',
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  payment_details JSONB,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_lat_lng ON buyers(lat_lng);
CREATE INDEX idx_admin_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_entity ON admin_audit_logs(entity_type);
CREATE INDEX idx_admin_audit_logs_created ON admin_audit_logs(created_at);
CREATE INDEX idx_offers_produce_id ON offers(produce_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_transactions_offer_id ON transactions(offer_id);
CREATE INDEX idx_transactions_produce_id ON transactions(produce_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_status ON transactions(status);