-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS config_audit_logs CASCADE;
DROP TABLE IF EXISTS system_configs CASCADE;
DROP TABLE IF EXISTS inspection_base_fee_config CASCADE;
DROP TABLE IF EXISTS produce_synonyms CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS business_metrics CASCADE;
DROP TABLE IF EXISTS daily_prices CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS quality_assessments CASCADE;
DROP TABLE IF EXISTS inspection_requests CASCADE;
DROP TABLE IF EXISTS inspection_distance_fee_config CASCADE;
DROP TABLE IF EXISTS produce CASCADE;
DROP TABLE IF EXISTS buyer_preferences CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all enums
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
DROP TYPE IF EXISTS verified_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_type_enum CASCADE;
DROP TYPE IF EXISTS transaction_event_enum CASCADE;
DROP TYPE IF EXISTS inspection_request_status_enum CASCADE;
DROP TYPE IF EXISTS metric_type_enum CASCADE;
DROP TYPE IF EXISTS metric_category_enum CASCADE;

-- Create all enums first
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
  'PENDING',
  'PENDING_AI_ASSESSMENT',
  'PENDING_INSPECTION',
  'ASSESSED',
  'ASSESSMENT_FAILED',
  'IN_PROGRESS',
  'FINAL_PRICE',
  'COMPLETED',
  'SOLD',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE quality_grade_enum AS ENUM (
  'A',
  'B',
  'C',
  'D',
  'F'
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
  'ACTIVE',
  'PRICE_MODIFIED',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE transactions_status_enum AS ENUM (
  'PENDING',
  'IN_PROGRESS',
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
  'QUALITY_ASSESSMENT_COMPLETED',
  'NEW_OFFER',
  'NEW_AUTO_OFFER',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'OFFER_MODIFIED',
  'OFFER_PRICE_MODIFIED',
  'OFFER_APPROVED',
  'OFFER_EXPIRED',
  'OFFER_PRICE_UPDATE',
  'OFFER_STATUS_UPDATE',
  'INSPECTION_REQUEST',
  'INSPECTION_REQUESTED',
  'INSPECTION_COMPLETED',
  'INSPECTION_CANCELLED',
  'DELIVERY_WINDOW_STARTED',
  'DELIVERY_WINDOW_EXPIRED',
  'DELIVERY_CONFIRMED',
  'RATING_REQUIRED',
  'RATING_RECEIVED',
  'TRANSACTION_UPDATE',
  'TRANSACTION_COMPLETED',
  'TRANSACTION_CANCELLED',
  'PAYMENT_REQUIRED',
  'PAYMENT_RECEIVED'
);

-- Create base tables first (no foreign key dependencies)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL,
  status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(6),
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  reset_password_token VARCHAR(255),
  reset_password_expires_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile_number ON users(mobile_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- Continue with dependent tables...
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  business_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_farmer UNIQUE (user_id)
);

CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_farmers_user_id ON farmers(user_id);

-- Continue with more tables in dependency order...
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  location POINT NOT NULL,
  size_in_acres DECIMAL(10,2),
  is_organic BOOLEAN DEFAULT FALSE,
  certification_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_farms_updated_at
  BEFORE UPDATE ON farms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX idx_farms_name ON farms(name);
CREATE INDEX idx_farms_location ON farms(location);

CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_address TEXT NOT NULL,
  business_type VARCHAR(100),
  tax_id VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_buyer UNIQUE (user_id)
);

CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON buyers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_business_name ON buyers(business_name);
CREATE INDEX idx_buyers_is_active ON buyers(is_active);

CREATE TABLE buyer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  produce_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_categories produce_category_enum[] DEFAULT ARRAY[]::produce_category_enum[],
  max_distance_km INTEGER,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  preferred_quality_grades quality_grade_enum[] DEFAULT ARRAY[]::quality_grade_enum[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_buyer_preferences UNIQUE (buyer_id)
);

CREATE TRIGGER update_buyer_preferences_updated_at
  BEFORE UPDATE ON buyer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_buyer_preferences_buyer_id ON buyer_preferences(buyer_id);
CREATE INDEX idx_buyer_preferences_produce_names ON buyer_preferences USING GIN (produce_names);

CREATE TABLE produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  produce_category produce_category_enum NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  status produce_status_enum NOT NULL DEFAULT 'PENDING',
  quality_grade quality_grade_enum,
  location POINT NOT NULL,
  harvest_date DATE,
  expiry_date DATE,
  is_organic BOOLEAN DEFAULT FALSE,
  certification_details TEXT,
  assigned_inspector UUID REFERENCES users(id),
  is_inspection_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_price_per_unit CHECK (price_per_unit > 0),
  CONSTRAINT check_quantity CHECK (quantity > 0)
);

CREATE TRIGGER update_produce_updated_at
  BEFORE UPDATE ON produce
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_produce_farmer_id ON produce(farmer_id);
CREATE INDEX idx_produce_farm_id ON produce(farm_id);
CREATE INDEX idx_produce_produce_category ON produce(produce_category);
CREATE INDEX idx_produce_status ON produce(status);
CREATE INDEX idx_produce_location ON produce(location);
CREATE INDEX idx_produce_assigned_inspector ON produce(assigned_inspector);
CREATE INDEX idx_produce_inspection_requested ON produce(is_inspection_requested);
CREATE INDEX idx_produce_expiry_date ON produce(expiry_date);
CREATE INDEX idx_produce_quality_grade ON produce(quality_grade);
CREATE INDEX idx_produce_farmer_status ON produce(farmer_id, status);
CREATE INDEX idx_produce_category_status ON produce(produce_category, status);

-- Continue with more tables...
CREATE TABLE inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id),
  inspector_id UUID REFERENCES users(id),
  status inspection_request_status_enum NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  inspection_fee DECIMAL(10,2),
  distance_fee DECIMAL(10,2),
  total_fee DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_inspection_requests_updated_at
  BEFORE UPDATE ON inspection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inspection_requests_produce_id ON inspection_requests(produce_id);
CREATE INDEX idx_inspection_requests_requester_id ON inspection_requests(requester_id);
CREATE INDEX idx_inspection_requests_inspector_id ON inspection_requests(inspector_id);
CREATE INDEX idx_inspection_requests_status ON inspection_requests(status);
CREATE INDEX idx_inspection_requests_scheduled_at ON inspection_requests(scheduled_at);
CREATE INDEX idx_inspection_requests_completed_at ON inspection_requests(completed_at);

CREATE TABLE quality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES users(id),
  inspection_request_id UUID REFERENCES inspection_requests(id),
  source assessment_source_enum NOT NULL,
  category produce_category_enum NOT NULL,
  produce_name VARCHAR(255) NOT NULL,
  quality_grade quality_grade_enum NOT NULL,
  confidence_level DECIMAL(5,2),
  assessment_details JSONB,
  images TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 100)
);

CREATE TRIGGER update_quality_assessments_updated_at
  BEFORE UPDATE ON quality_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_quality_assessments_produce_id ON quality_assessments(produce_id);
CREATE INDEX idx_quality_assessments_inspector_id ON quality_assessments(inspector_id);
CREATE INDEX idx_quality_assessments_inspection_request_id ON quality_assessments(inspection_request_id);
CREATE INDEX idx_quality_assessments_source ON quality_assessments(source);
CREATE INDEX idx_quality_assessments_category ON quality_assessments(category);
CREATE INDEX idx_quality_assessments_created_at ON quality_assessments(created_at);
CREATE INDEX idx_quality_assessments_produce_name ON quality_assessments(produce_name);
CREATE INDEX idx_quality_assessments_confidence ON quality_assessments(confidence_level);

CREATE TABLE inspection_distance_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_distance_km INTEGER NOT NULL,
  max_distance_km INTEGER NOT NULL,
  fee_per_km DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_distance_range CHECK (min_distance_km < max_distance_km),
  CONSTRAINT check_fee_per_km CHECK (fee_per_km >= 0)
);

CREATE TRIGGER update_inspection_distance_fee_config_updated_at
  BEFORE UPDATE ON inspection_distance_fee_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inspection_distance_fee_config_is_active ON inspection_distance_fee_config(is_active);

CREATE TABLE inspection_base_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_category produce_category_enum NOT NULL,
  base_fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_base_fee CHECK (base_fee >= 0)
);

CREATE TRIGGER update_inspection_base_fee_config_updated_at
  BEFORE UPDATE ON inspection_base_fee_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inspection_base_fee_config_produce_category ON inspection_base_fee_config(produce_category);
CREATE INDEX idx_inspection_base_fee_config_is_active ON inspection_base_fee_config(is_active);

-- Continue with more tables... 

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id UUID NOT NULL REFERENCES produce(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  quantity DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status offers_status_enum NOT NULL DEFAULT 'PENDING',
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  quality_grade quality_grade_enum,
  distance_km DECIMAL(10,2),
  buyer_min_price DECIMAL(10,2),
  buyer_max_price DECIMAL(10,2),
  is_price_overridden BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_price_per_unit CHECK (price_per_unit > 0),
  CONSTRAINT check_quantity CHECK (quantity > 0),
  CONSTRAINT check_total_price CHECK (total_price > 0)
);

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_offers_produce_id ON offers(produce_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_farmer_id ON offers(farmer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_valid_until ON offers(valid_until);
CREATE INDEX idx_offers_is_auto_generated ON offers(is_auto_generated);
CREATE INDEX idx_offers_quality_grade ON offers(quality_grade);
CREATE INDEX idx_offers_price_override ON offers(is_price_overridden);
CREATE INDEX idx_offers_distance ON offers(distance_km);
CREATE INDEX idx_offers_buyer_price_range ON offers(buyer_min_price, buyer_max_price);
CREATE INDEX idx_offers_status_valid_until ON offers(status, valid_until);
CREATE INDEX idx_offers_farmer_status ON offers(farmer_id, status);
CREATE INDEX idx_offers_produce_status ON offers(produce_id, status);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id),
  produce_id UUID NOT NULL REFERENCES produce(id),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  quantity DECIMAL(10,2) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status transactions_status_enum NOT NULL DEFAULT 'PENDING',
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  payment_details JSONB,
  delivery_window_starts_at TIMESTAMP WITH TIME ZONE,
  delivery_window_ends_at TIMESTAMP WITH TIME ZONE,
  delivery_completed_at TIMESTAMP WITH TIME ZONE,
  delivery_location POINT,
  delivery_notes TEXT,
  requires_rating BOOLEAN DEFAULT TRUE,
  rating_completed BOOLEAN DEFAULT FALSE,
  inspection_fee DECIMAL(10,2),
  inspection_fee_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_transaction_quantity CHECK (quantity > 0),
  CONSTRAINT check_transaction_price CHECK (price_per_unit > 0),
  CONSTRAINT check_transaction_total CHECK (total_price > 0)
);

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_transactions_offer_id ON transactions(offer_id);
CREATE INDEX idx_transactions_produce_id ON transactions(produce_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_delivery_window ON transactions(delivery_window_starts_at, delivery_window_ends_at);
CREATE INDEX idx_transactions_rating ON transactions(requires_rating, rating_completed);
CREATE INDEX idx_transactions_inspection_fee ON transactions(inspection_fee_paid);

CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  event transaction_event_enum NOT NULL,
  user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_transaction_history_updated_at
  BEFORE UPDATE ON transaction_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_transaction_history_transaction ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_event ON transaction_history(event);
CREATE INDEX idx_transaction_history_user ON transaction_history(user_id);
CREATE INDEX idx_transaction_history_created ON transaction_history(created_at);

-- Continue with more tables... 

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type media_type_enum NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  size_bytes BIGINT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_mime_type ON media(mime_type);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_types notification_type_enum[] DEFAULT ARRAY[]::notification_type_enum[],
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_notification_preferences UNIQUE (user_id)
);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_notification_types ON notification_preferences USING GIN (notification_types);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type report_type_enum NOT NULL,
  format report_format_enum NOT NULL,
  status report_status_enum NOT NULL DEFAULT 'DRAFT',
  parameters JSONB,
  result_url TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_completed_at ON reports(completed_at);
CREATE INDEX idx_reports_scheduled_time ON reports(scheduled_time);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status support_status_enum NOT NULL DEFAULT 'OPEN',
  priority support_priority_enum NOT NULL DEFAULT 'MEDIUM',
  category support_category_enum NOT NULL,
  assigned_to_id UUID REFERENCES users(id),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to_id);

CREATE TABLE daily_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_name VARCHAR(255) NOT NULL,
  produce_category produce_category_enum NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  market_location POINT,
  source VARCHAR(100),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_min_price CHECK (min_price > 0),
  CONSTRAINT check_max_price CHECK (max_price >= min_price),
  CONSTRAINT check_avg_price CHECK (avg_price >= min_price AND avg_price <= max_price)
);

CREATE TRIGGER update_daily_prices_updated_at
  BEFORE UPDATE ON daily_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_daily_prices_produce_name ON daily_prices(produce_name);
CREATE INDEX idx_daily_prices_category ON daily_prices(produce_category);
CREATE INDEX idx_daily_prices_validity ON daily_prices(valid_from, valid_until);

CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type business_metric_type_enum NOT NULL,
  category metric_category_enum,
  value DECIMAL(15,2) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_business_metrics_updated_at
  BEFORE UPDATE ON business_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_business_metrics_type ON business_metrics(type);
CREATE INDEX idx_business_metrics_category ON business_metrics(category);
CREATE INDEX idx_business_metrics_period ON business_metrics(period_start, period_end);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  rating_user_id UUID NOT NULL REFERENCES users(id),
  rated_user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5)
);

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_ratings_transaction_id ON ratings(transaction_id);
CREATE INDEX idx_ratings_rating_user_id ON ratings(rating_user_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_bank_accounts_farmer_id ON bank_accounts(farmer_id);
CREATE INDEX idx_bank_accounts_is_primary ON bank_accounts(is_primary);

CREATE TABLE produce_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_name VARCHAR(255) NOT NULL,
  synonym VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) DEFAULT 'en',
  confidence_score DECIMAL(5,2),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_produce_synonyms_updated_at
  BEFORE UPDATE ON produce_synonyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_produce_synonyms_produce_name ON produce_synonyms(produce_name);
CREATE INDEX idx_produce_synonyms_synonym ON produce_synonyms(synonym);
CREATE INDEX idx_produce_synonyms_is_active ON produce_synonyms(is_active);
CREATE INDEX idx_produce_synonyms_last_validated_at ON produce_synonyms(last_validated_at);

CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key system_config_key_enum NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_active_config_key UNIQUE (key, is_active)
);

CREATE TRIGGER update_system_configs_updated_at
  BEFORE UPDATE ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_system_configs_key ON system_configs(key);
CREATE INDEX idx_system_configs_is_active ON system_configs(is_active);

CREATE TABLE config_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key system_config_key_enum NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  updated_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_config_audit_logs_config_key ON config_audit_logs(config_key);
CREATE INDEX idx_config_audit_logs_updated_by ON config_audit_logs(updated_by);
CREATE INDEX idx_config_audit_logs_created_at ON config_audit_logs(created_at);

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action admin_action_type_enum NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_state JSONB,
  new_state JSONB,
  reason TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_admin_audit_logs_updated_at
  BEFORE UPDATE ON admin_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_entity_id ON admin_audit_logs(entity_id);
CREATE INDEX idx_admin_audit_logs_entity_type ON admin_audit_logs(entity_type);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);