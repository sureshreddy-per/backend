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
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS config_audit_logs CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS synonyms CASCADE;
DROP TABLE IF EXISTS daily_prices CASCADE;
DROP TABLE IF EXISTS business_metrics CASCADE;

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
DROP TYPE IF EXISTS media_type_enum CASCADE;
DROP TYPE IF EXISTS media_category_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;
DROP TYPE IF EXISTS report_type_enum CASCADE;
DROP TYPE IF EXISTS report_format_enum CASCADE;
DROP TYPE IF EXISTS report_status_enum CASCADE;
DROP TYPE IF EXISTS support_status_enum CASCADE;
DROP TYPE IF EXISTS support_priority_enum CASCADE;
DROP TYPE IF EXISTS support_category_enum CASCADE;
DROP TYPE IF EXISTS business_metric_type_enum CASCADE;
DROP TYPE IF EXISTS system_config_key_enum CASCADE;

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
  'PENDING_AI_ASSESSMENT',
  'PENDING_INSPECTION',
  'REJECTED',
  'IN_PROGRESS',
  'SOLD',
  'CANCELLED',
  'ASSESSMENT_FAILED'
);

CREATE TYPE assessment_source_enum AS ENUM (
  'AI',
  'MANUAL_INSPECTION'
);

CREATE TYPE admin_action_type_enum AS ENUM (
  'BLOCK_USER',
  'UNBLOCK_USER',
  'DELETE_PRODUCE',
  'CANCEL_OFFER',
  'CANCEL_TRANSACTION',
  'ASSIGN_INSPECTOR',
  'UPDATE_SYSTEM_CONFIG'
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

CREATE TYPE media_type_enum AS ENUM (
  'IMAGE',
  'VIDEO',
  'DOCUMENT'
);

CREATE TYPE media_category_enum AS ENUM (
  'PRODUCE',
  'PROFILE',
  'INSPECTION',
  'QUALITY_ASSESSMENT'
);

CREATE TYPE notification_type_enum AS ENUM (
  'QUALITY_UPDATE',
  'NEW_OFFER',
  'OFFER_PRICE_UPDATE',
  'OFFER_STATUS_UPDATE',
  'INSPECTION_REQUEST',
  'INSPECTION_COMPLETED',
  'TRANSACTION_UPDATE'
);

CREATE TYPE report_type_enum AS ENUM (
  'USER_ACTIVITY',
  'TRANSACTION_SUMMARY',
  'PRODUCE_ANALYTICS',
  'QUALITY_METRICS',
  'MARKET_TRENDS',
  'FINANCIAL_SUMMARY',
  'INSPECTION_SUMMARY',
  'CUSTOM'
);

CREATE TYPE report_format_enum AS ENUM (
  'PDF',
  'CSV',
  'EXCEL',
  'JSON'
);

CREATE TYPE report_status_enum AS ENUM (
  'QUEUED',
  'GENERATING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE support_status_enum AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
);

CREATE TYPE support_priority_enum AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE support_category_enum AS ENUM (
  'GENERAL',
  'TECHNICAL',
  'BILLING',
  'ACCOUNT',
  'ORDER',
  'OTHER'
);

CREATE TYPE business_metric_type_enum AS ENUM (
  'PRODUCTION_COST',
  'SALES_REVENUE',
  'PROFIT_MARGIN',
  'CUSTOM'
);

-- Create system config key enum
CREATE TYPE system_config_key_enum AS ENUM (
  'max_daily_price_updates',
  'max_geospatial_radius_km',
  'base_fee_percentage',
  'min_inspection_fee',
  'max_inspection_fee',
  'inspection_base_fee',
  'inspection_fee_per_km'
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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_mobile_number CHECK (mobile_number ~ '^\+[1-9]\d{1,14}$')
);

-- Create farmers table
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create farms table
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  size_in_acres DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_location_format CHECK (location ~ '^-?\d+(\.\d+)?,-?\d+(\.\d+)?$'),
  CONSTRAINT valid_latitude CHECK (CAST(split_part(location, ',', 1) AS DECIMAL) BETWEEN -90 AND 90),
  CONSTRAINT valid_longitude CHECK (CAST(split_part(location, ',', 2) AS DECIMAL) BETWEEN -180 AND 180)
);

-- Create produce table
CREATE TABLE produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  farm_id UUID REFERENCES farms(id),
  name VARCHAR(255),
  description TEXT,
  product_variety VARCHAR(255),
  produce_category produce_category_enum,
  quantity DECIMAL NOT NULL,
  unit VARCHAR(50),
  price_per_unit DECIMAL(10,2),
  location TEXT,
  location_name VARCHAR(255),
  inspection_fee DECIMAL(10,2),
  is_inspection_requested BOOLEAN DEFAULT FALSE,
  inspection_requested_by UUID,
  inspection_requested_at TIMESTAMP,
  images TEXT[],
  status produce_status_enum NOT NULL DEFAULT 'PENDING_AI_ASSESSMENT',
  harvested_at TIMESTAMP,
  expiry_date TIMESTAMP,
  quality_grade INTEGER DEFAULT 0,
  video_url VARCHAR(255),
  assigned_inspector UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_quality_grade CHECK (quality_grade >= -1 AND quality_grade <= 10)
);

-- Create produce_synonyms table
CREATE TABLE produce_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name VARCHAR(255) NOT NULL,
  synonym VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  language VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create quality_assessments table
CREATE TABLE quality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id),
  source assessment_source_enum NOT NULL DEFAULT 'AI',
  quality_grade INTEGER NOT NULL,
  confidence_level DECIMAL(5,2) NOT NULL,
  defects TEXT[] NULL,
  recommendations TEXT[] NULL,
  description TEXT NULL,
  category produce_category_enum NOT NULL,
  category_specific_assessment JSONB NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_quality_grade CHECK (quality_grade >= -1 AND quality_grade <= 10),
  CONSTRAINT check_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 100),
  CONSTRAINT category_specific_assessment_validation CHECK (
    CASE category
      WHEN 'FOOD_GRAINS' THEN
        (category_specific_assessment->>'variety') IS NOT NULL AND
        (category_specific_assessment->>'moisture_content') IS NOT NULL AND
        (category_specific_assessment->>'foreign_matter') IS NOT NULL AND
        (category_specific_assessment->>'protein_content') IS NOT NULL AND
        (category_specific_assessment->>'wastage') IS NOT NULL
      WHEN 'OILSEEDS' THEN
        (category_specific_assessment->>'oil_content') IS NOT NULL AND
        (category_specific_assessment->>'seed_size') IS NOT NULL AND
        (category_specific_assessment->>'moisture_content') IS NOT NULL
      WHEN 'FRUITS' THEN
        (category_specific_assessment->>'sweetness_brix') IS NOT NULL AND
        (category_specific_assessment->>'size') IS NOT NULL AND
        (category_specific_assessment->>'color') IS NOT NULL AND
        (category_specific_assessment->>'ripeness') IS NOT NULL
      WHEN 'VEGETABLES' THEN
        (category_specific_assessment->>'freshness_level') IS NOT NULL AND
        (category_specific_assessment->>'size') IS NOT NULL AND
        (category_specific_assessment->>'color') IS NOT NULL
      WHEN 'SPICES' THEN
        (category_specific_assessment->>'volatile_oil_content') IS NOT NULL AND
        (category_specific_assessment->>'aroma_quality') IS NOT NULL AND
        (category_specific_assessment->>'purity') IS NOT NULL
      WHEN 'FIBERS' THEN
        (category_specific_assessment->>'staple_length') IS NOT NULL AND
        (category_specific_assessment->>'fiber_strength') IS NOT NULL AND
        (category_specific_assessment->>'trash_content') IS NOT NULL
      WHEN 'SUGARCANE' THEN
        (category_specific_assessment->>'variety') IS NOT NULL AND
        (category_specific_assessment->>'brix_content') IS NOT NULL AND
        (category_specific_assessment->>'fiber_content') IS NOT NULL AND
        (category_specific_assessment->>'stalk_length') IS NOT NULL
      WHEN 'FLOWERS' THEN
        (category_specific_assessment->>'freshness_level') IS NOT NULL AND
        (category_specific_assessment->>'fragrance_quality') IS NOT NULL AND
        (category_specific_assessment->>'stem_length') IS NOT NULL
      WHEN 'MEDICINAL_PLANTS' THEN
        (category_specific_assessment->>'essential_oil_yield') IS NOT NULL AND
        (category_specific_assessment->>'purity_of_extracts') IS NOT NULL AND
        (category_specific_assessment->>'moisture_content') IS NOT NULL
      ELSE false
    END
  )
);

-- Create inspection_base_fees table
CREATE TABLE inspection_base_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_category produce_category_enum NOT NULL,
  base_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- System configuration is handled by the system_configs table defined later

-- Create buyers table
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create buyer_preferences table
CREATE TABLE buyer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  categories produce_category_enum[],
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_methods TEXT[],
  target_price DECIMAL(10,2),
  price_alert_condition VARCHAR(50),
  expiry_date TIMESTAMP,
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
  is_auto_generated BOOLEAN NOT NULL DEFAULT TRUE,
  buyer_min_price DECIMAL(10,2) NOT NULL,
  buyer_max_price DECIMAL(10,2) NOT NULL,
  quality_grade INTEGER NOT NULL DEFAULT 0,
  distance_km DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_quality_grade CHECK (quality_grade >= -1 AND quality_grade <= 10),
  CONSTRAINT valid_price_range CHECK (
    price_per_unit >= buyer_min_price AND 
    price_per_unit <= buyer_max_price
  ),
  CONSTRAINT valid_distance CHECK (
    distance_km <= 100
  )
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

-- Create media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  key TEXT NOT NULL,
  type media_type_enum NOT NULL,
  category media_category_enum NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type notification_type_enum NOT NULL,
  data JSONB NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type report_type_enum NOT NULL,
  format report_format_enum NOT NULL,
  status report_status_enum NOT NULL DEFAULT 'QUEUED',
  parameters JSONB NOT NULL,
  file_url TEXT NULL,
  file_size INTEGER NULL,
  summary JSONB NULL,
  error_message TEXT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NULL,
  completed_time TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create config_audit_logs table
CREATE TABLE config_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  old_value JSONB NULL,
  new_value JSONB NOT NULL,
  updated_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create support_tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status support_status_enum NOT NULL DEFAULT 'OPEN',
  priority support_priority_enum NOT NULL DEFAULT 'MEDIUM',
  category support_category_enum NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  attachments TEXT[] DEFAULT '{}',
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create synonyms table
CREATE TABLE synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  words JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_prices table
CREATE TABLE daily_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  produce_category produce_category_enum NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  minimum_quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create business_metrics table
CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type business_metric_type_enum NOT NULL,
  user_id UUID NULL REFERENCES users(id),
  entity_id UUID NULL,
  entity_type TEXT NULL,
  processing_time INTEGER NULL,
  value DECIMAL(10,2) NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inspection_distance_fee_config table
CREATE TABLE inspection_distance_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_per_km DECIMAL(10,2) NOT NULL,
  max_distance_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NULL REFERENCES users(id),
  updated_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create system_configs table
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key system_config_key_enum NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(key)
);

-- Insert default configurations
INSERT INTO system_configs (key, value, description) VALUES
  ('max_daily_price_updates', '3', 'Maximum number of price updates a buyer can make per day'),
  ('max_geospatial_radius_km', '100', 'Maximum radius in kilometers for geospatial queries'),
  ('base_fee_percentage', '2.5', 'Base fee percentage for transactions'),
  ('min_inspection_fee', '100', 'Minimum inspection fee in cents'),
  ('max_inspection_fee', '1000', 'Maximum inspection fee in cents'),
  ('inspection_base_fee', '200', 'Base fee for inspections'),
  ('inspection_fee_per_km', '5', 'Fee per kilometer for inspection distance')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_configs_updated_at
    BEFORE UPDATE ON system_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_preferences_updated_at
    BEFORE UPDATE ON buyer_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add index for faster key lookups
CREATE INDEX idx_system_configs_key ON system_configs(key);

-- Add constraint to ensure value is not empty
ALTER TABLE system_configs
ADD CONSTRAINT system_configs_value_not_empty
CHECK (value <> '');

-- Create indexes
CREATE INDEX idx_users_mobile_number ON users(mobile_number);
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
CREATE INDEX idx_media_entity ON media(entity_id);
CREATE INDEX idx_media_user ON media(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_produce_farmer_id ON produce(farmer_id);
CREATE INDEX idx_produce_farm_id ON produce(farm_id);
CREATE INDEX idx_produce_status ON produce(status);
CREATE INDEX idx_produce_category ON produce(produce_category);
CREATE INDEX idx_quality_assessments_produce_id ON quality_assessments(produce_id);
CREATE INDEX idx_inspection_requests_produce_id ON inspection_requests(produce_id);
CREATE INDEX idx_inspection_requests_inspector_id ON inspection_requests(inspector_id);
CREATE INDEX idx_daily_prices_buyer_category ON daily_prices(buyer_id, produce_category);
CREATE INDEX idx_daily_prices_active_validity ON daily_prices(is_active, valid_from, valid_until);
CREATE INDEX idx_business_metrics_type ON business_metrics(type);
CREATE INDEX idx_business_metrics_user ON business_metrics(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_inspection_base_fees_category ON inspection_base_fees(produce_category);
CREATE INDEX idx_inspection_base_fees_active ON inspection_base_fees(is_active);
CREATE INDEX idx_buyer_preferences_buyer_id ON buyer_preferences(buyer_id);