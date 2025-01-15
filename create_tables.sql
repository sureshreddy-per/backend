-- First, drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS inspection_base_fee_config CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS config_audit_logs CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS system_configs CASCADE;
DROP TABLE IF EXISTS produce_synonyms CASCADE;
DROP TABLE IF EXISTS business_metrics CASCADE;
DROP TABLE IF EXISTS daily_prices CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS farm_details CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS buyer_preferences CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS quality_assessments CASCADE;
DROP TABLE IF EXISTS inspection_requests CASCADE;
DROP TABLE IF EXISTS inspection_distance_fee_config CASCADE;
DROP TABLE IF EXISTS produce CASCADE;
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

-- Create all enums
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
  'DRAFT',
  'IN_PROGRESS',
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
  'USER_REGISTRATION',
  'USER_LOGIN',
  'USER_VERIFICATION',
  'PRODUCE_LISTED',
  'PRODUCE_SOLD',
  'OFFER_CREATED',
  'OFFER_ACCEPTED',
  'TRANSACTION_COMPLETED',
  'INSPECTION_COMPLETED'
);

CREATE TYPE system_config_key_enum AS ENUM (
  'max_daily_price_updates',
  'max_geospatial_radius_km',
  'base_fee_percentage',
  'min_inspection_fee',
  'max_inspection_fee',
  'inspection_base_fee',
  'inspection_fee_per_km'
);

CREATE TYPE verified_status_enum AS ENUM (
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

CREATE TYPE ticket_type_enum AS ENUM (
  'SUPPORT',
  'COMPLAINT',
  'FEEDBACK',
  'INQUIRY',
  'TECHNICAL'
);

CREATE TYPE transaction_event_enum AS ENUM (
  'STATUS_CHANGED',
  'DELIVERY_WINDOW_STARTED',
  'DELIVERY_CONFIRMED',
  'INSPECTION_COMPLETED',
  'RATING_SUBMITTED',
  'PAYMENT_PROCESSED',
  'NOTE_ADDED'
);

CREATE TYPE inspection_request_status_enum AS ENUM (
    'PENDING',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE metric_type_enum AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY'
);

CREATE TYPE metric_category_enum AS ENUM (
    'REVENUE',
    'TRANSACTIONS',
    'USERS',
    'PRODUCE',
    'INSPECTIONS',
    'OFFERS'
);

-- Create all tables first (in dependency order)
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    mobile_number TEXT UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'BUYER',
    status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
    block_reason TEXT,
    fcm_token TEXT,
    avatar_url TEXT,
    login_attempts INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    scheduled_for_deletion_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_mobile_number CHECK (mobile_number ~ '^\+[1-9]\d{1,14}$')
);

CREATE INDEX idx_users_mobile_number ON users(mobile_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmers_user_id ON farmers(user_id);

CREATE OR REPLACE FUNCTION update_farmers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_farmers_updated_at();

CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  name TEXT NOT NULL,
  description TEXT,
  size_in_acres DECIMAL NOT NULL,
  address TEXT,
  location TEXT,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX idx_farms_name ON farms(name);
CREATE INDEX idx_farms_location ON farms(location);

CREATE OR REPLACE FUNCTION update_farms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION update_farms_updated_at();

DROP TABLE IF EXISTS produce CASCADE;

CREATE TABLE produce (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    farm_id UUID REFERENCES farms(id),
    name TEXT NOT NULL,
    description TEXT,
    product_variety TEXT,
    produce_category produce_category_enum,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT,
    price_per_unit DECIMAL(10,2),
    location TEXT NOT NULL,
    location_name TEXT,
    inspection_fee DECIMAL(10,2),
    is_inspection_requested BOOLEAN DEFAULT false,
    inspection_requested_by UUID REFERENCES users(id),
    inspection_requested_at TIMESTAMP WITH TIME ZONE,
    images TEXT[] NOT NULL,
    status produce_status_enum DEFAULT 'PENDING_AI_ASSESSMENT',
    harvested_at TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    quality_grade INTEGER DEFAULT 0,
    video_url TEXT,
    assigned_inspector UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity CHECK (quantity > 0),
    CONSTRAINT check_price_per_unit CHECK (price_per_unit >= 0),
    CONSTRAINT check_inspection_fee CHECK (inspection_fee >= 0),
    CONSTRAINT check_quality_grade CHECK (quality_grade >= -1 AND quality_grade <= 10)
);

CREATE INDEX idx_produce_farmer_id ON produce(farmer_id);
CREATE INDEX idx_produce_farm_id ON produce(farm_id);
CREATE INDEX idx_produce_produce_category ON produce(produce_category);
CREATE INDEX idx_produce_status ON produce(status);
CREATE INDEX idx_produce_location ON produce(location);
CREATE INDEX idx_produce_assigned_inspector ON produce(assigned_inspector);
CREATE INDEX idx_produce_inspection_requested ON produce(is_inspection_requested);
CREATE INDEX idx_produce_expiry_date ON produce(expiry_date);
CREATE INDEX idx_produce_quality_grade ON produce(quality_grade);

CREATE OR REPLACE FUNCTION update_produce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produce_updated_at
    BEFORE UPDATE ON produce
    FOR EACH ROW
    EXECUTE FUNCTION update_produce_updated_at();

CREATE TABLE inspection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produce_id UUID NOT NULL REFERENCES produce(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  inspector_id UUID REFERENCES users(id),
  location TEXT NOT NULL,
  inspection_fee DECIMAL(10,2) NOT NULL,
  status inspection_request_status_enum NOT NULL DEFAULT 'PENDING',
  scheduled_at TIMESTAMP,
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspection_requests_produce_id ON inspection_requests(produce_id);
CREATE INDEX idx_inspection_requests_requester_id ON inspection_requests(requester_id);
CREATE INDEX idx_inspection_requests_inspector_id ON inspection_requests(inspector_id);
CREATE INDEX idx_inspection_requests_status ON inspection_requests(status);
CREATE INDEX idx_inspection_requests_scheduled_at ON inspection_requests(scheduled_at);
CREATE INDEX idx_inspection_requests_completed_at ON inspection_requests(completed_at);

CREATE OR REPLACE FUNCTION update_inspection_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspection_requests_updated_at
    BEFORE UPDATE ON inspection_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_inspection_requests_updated_at();

CREATE TABLE quality_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produce_id UUID NOT NULL REFERENCES produce(id),
    produce_name TEXT NOT NULL,
    quality_grade FLOAT NOT NULL,
    confidence_level FLOAT NOT NULL,
    defects TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    description TEXT,
    category produce_category_enum NOT NULL,
    category_specific_assessment JSONB NOT NULL,
    source assessment_source_enum NOT NULL DEFAULT 'AI',
    inspector_id UUID REFERENCES users(id),
    inspection_request_id UUID REFERENCES inspection_requests(id),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 100)
);

CREATE INDEX idx_quality_assessments_produce_id ON quality_assessments(produce_id);
CREATE INDEX idx_quality_assessments_inspector_id ON quality_assessments(inspector_id);
CREATE INDEX idx_quality_assessments_inspection_request_id ON quality_assessments(inspection_request_id);
CREATE INDEX idx_quality_assessments_source ON quality_assessments(source);
CREATE INDEX idx_quality_assessments_category ON quality_assessments(category);
CREATE INDEX idx_quality_assessments_created_at ON quality_assessments(created_at);
CREATE INDEX idx_quality_assessments_produce_name ON quality_assessments(produce_name);
CREATE INDEX idx_quality_assessments_confidence ON quality_assessments(confidence_level);

CREATE OR REPLACE FUNCTION update_quality_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quality_assessments_updated_at
    BEFORE UPDATE ON quality_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_quality_assessments_updated_at();

CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gst TEXT,
  business_name TEXT NOT NULL,
  registration_number TEXT,
  lat_lng TEXT,
  location_name TEXT,
  address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_business_name ON buyers(business_name);
CREATE INDEX idx_buyers_is_active ON buyers(is_active);

CREATE TABLE buyer_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  produce_names TEXT[] DEFAULT '{}',
  notification_enabled BOOLEAN DEFAULT true,
  notification_methods TEXT[] DEFAULT '{"PUSH"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_buyer_preferences UNIQUE (buyer_id)
);

CREATE INDEX idx_buyer_preferences_buyer_id ON buyer_preferences(buyer_id);
CREATE INDEX idx_buyer_preferences_produce_names ON buyer_preferences USING GIN (produce_names);

CREATE OR REPLACE FUNCTION update_buyers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_buyers_updated_at
    BEFORE UPDATE ON buyers
    FOR EACH ROW
    EXECUTE FUNCTION update_buyers_updated_at();

CREATE OR REPLACE FUNCTION update_buyer_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_buyer_preferences_updated_at
    BEFORE UPDATE ON buyer_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_buyer_preferences_updated_at();

DROP TABLE IF EXISTS offers CASCADE;

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produce_id UUID NOT NULL REFERENCES produce(id),
    buyer_id UUID NOT NULL REFERENCES buyers(id),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    price_per_unit DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    status offers_status_enum NOT NULL DEFAULT 'PENDING',
    valid_until TIMESTAMP,
    is_auto_generated BOOLEAN DEFAULT false,
    buyer_min_price DECIMAL(10,2) NOT NULL,
    buyer_max_price DECIMAL(10,2) NOT NULL,
    quality_grade INTEGER NOT NULL,
    distance_km DECIMAL(10,2) NOT NULL,
    inspection_fee DECIMAL(10,2) NOT NULL,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    is_price_overridden BOOLEAN DEFAULT false,
    price_override_reason TEXT,
    price_override_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_price_per_unit CHECK (price_per_unit >= 0),
    CONSTRAINT check_quantity CHECK (quantity > 0),
    CONSTRAINT check_buyer_price_range CHECK (buyer_max_price >= buyer_min_price),
    CONSTRAINT check_quality_grade CHECK (quality_grade >= -1 AND quality_grade <= 10),
    CONSTRAINT check_distance CHECK (distance_km >= 0),
    CONSTRAINT check_inspection_fee CHECK (inspection_fee >= 0)
);

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

CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_offers_updated_at();

DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(id),
    produce_id UUID NOT NULL REFERENCES produce(id),
    buyer_id UUID NOT NULL REFERENCES buyers(id),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    final_price DECIMAL(10,2) NOT NULL,
    final_quantity DECIMAL(10,2) NOT NULL,
    status transactions_status_enum NOT NULL DEFAULT 'PENDING',
    delivery_window_starts_at TIMESTAMP,
    delivery_window_ends_at TIMESTAMP,
    delivery_confirmed_at TIMESTAMP,
    buyer_inspection_completed_at TIMESTAMP,
    requires_rating BOOLEAN DEFAULT false,
    rating_completed BOOLEAN DEFAULT false,
    inspection_fee_paid BOOLEAN DEFAULT false,
    inspection_fee_paid_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_final_price CHECK (final_price >= 0),
    CONSTRAINT check_final_quantity CHECK (final_quantity > 0),
    CONSTRAINT check_delivery_window CHECK (delivery_window_ends_at >= delivery_window_starts_at)
);

CREATE INDEX idx_transactions_offer_id ON transactions(offer_id);
CREATE INDEX idx_transactions_produce_id ON transactions(produce_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_delivery_window ON transactions(delivery_window_starts_at, delivery_window_ends_at);
CREATE INDEX idx_transactions_rating ON transactions(requires_rating, rating_completed);
CREATE INDEX idx_transactions_inspection_fee ON transactions(inspection_fee_paid);

CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- Now add all foreign key constraints
ALTER TABLE farmers
  ADD CONSTRAINT fk_farmers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE farms
  ADD CONSTRAINT fk_farms_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE;

ALTER TABLE produce
  ADD CONSTRAINT fk_produce_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_produce_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_produce_inspector FOREIGN KEY (assigned_inspector) REFERENCES users(id) ON DELETE SET NULL;

-- Add check constraints
ALTER TABLE produce
  ADD CONSTRAINT check_produce_quantity CHECK (quantity > 0),
  ADD CONSTRAINT check_price_per_unit CHECK (price_per_unit >= 0),
  ADD CONSTRAINT check_inspection_fee CHECK (inspection_fee >= 0);

-- Create indexes
CREATE INDEX idx_users_mobile_number ON users(mobile_number);
CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create remaining tables
DROP TABLE IF EXISTS media CASCADE;

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    key TEXT NOT NULL,
    type media_type_enum NOT NULL DEFAULT 'IMAGE',
    mime_type TEXT,
    size INTEGER,
    original_name TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_mime_type ON media(mime_type);
CREATE INDEX idx_media_key ON media(key);

CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type notification_type_enum NOT NULL,
  data JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.read_at = CASE
        WHEN OLD.is_read = FALSE AND NEW.is_read = TRUE THEN CURRENT_TIMESTAMP
        ELSE NEW.read_at
    END;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  notification_types notification_type_enum[] DEFAULT ARRAY[]::notification_type_enum[],
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_notification_types ON notification_preferences USING GIN (notification_types);

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type report_type_enum NOT NULL,
  format report_format_enum NOT NULL,
  status report_status_enum NOT NULL DEFAULT 'DRAFT',
  parameters JSONB,
  file_url TEXT,
  file_size INTEGER,
  summary JSONB,
  error_message TEXT,
  completed_at TIMESTAMP,
  scheduled_time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status support_status_enum NOT NULL DEFAULT 'OPEN',
  priority support_priority_enum NOT NULL DEFAULT 'MEDIUM',
  category support_category_enum NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  attachments TEXT[] DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);

CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();

DROP TABLE IF EXISTS daily_prices CASCADE;

CREATE TABLE daily_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produce_name TEXT NOT NULL,
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NOT NULL,
    average_price DECIMAL(10,2) NOT NULL,
    market_name TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_min_price CHECK (min_price >= 0),
    CONSTRAINT check_max_price CHECK (max_price >= min_price),
    CONSTRAINT check_average_price CHECK (average_price >= min_price AND average_price <= max_price)
);

CREATE INDEX idx_daily_prices_produce_name ON daily_prices(produce_name);
CREATE INDEX idx_daily_prices_created_at ON daily_prices(created_at DESC);

CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type metric_type_enum NOT NULL,
    category metric_category_enum NOT NULL,
    data JSONB NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_metrics_type ON business_metrics(type);
CREATE INDEX idx_business_metrics_category ON business_metrics(category);
CREATE INDEX idx_business_metrics_period ON business_metrics(period_start, period_end);

CREATE OR REPLACE FUNCTION update_business_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_metrics_updated_at
    BEFORE UPDATE ON business_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_business_metrics_updated_at();

DROP TABLE IF EXISTS ratings CASCADE;

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

CREATE INDEX idx_ratings_transaction_id ON ratings(transaction_id);
CREATE INDEX idx_ratings_rating_user_id ON ratings(rating_user_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

CREATE OR REPLACE FUNCTION update_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_ratings_updated_at();

DROP TABLE IF EXISTS bank_accounts CASCADE;

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_code TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_accounts_farmer_id ON bank_accounts(farmer_id);
CREATE INDEX idx_bank_accounts_is_primary ON bank_accounts(is_primary);

CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_accounts_updated_at();

CREATE TABLE inspection_distance_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_per_km DECIMAL(10,2) NOT NULL,
    max_distance_fee DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_inspection_distance_fee_config_is_active ON inspection_distance_fee_config(is_active);

CREATE OR REPLACE FUNCTION update_inspection_distance_fee_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspection_distance_fee_config_updated_at
    BEFORE UPDATE ON inspection_distance_fee_config
    FOR EACH ROW
    EXECUTE FUNCTION update_inspection_distance_fee_config_updated_at();

-- Drop existing constraints before adding new ones
ALTER TABLE produce DROP CONSTRAINT IF EXISTS check_produce_quantity;
ALTER TABLE produce DROP CONSTRAINT IF EXISTS check_price_per_unit;
ALTER TABLE produce DROP CONSTRAINT IF EXISTS check_inspection_fee;

-- Now add all foreign key constraints
ALTER TABLE farmers
  ADD CONSTRAINT fk_farmers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE farms
  ADD CONSTRAINT fk_farms_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE;

ALTER TABLE produce
  ADD CONSTRAINT fk_produce_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_produce_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_produce_inspector FOREIGN KEY (assigned_inspector) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE quality_assessments
  ADD CONSTRAINT fk_quality_assessments_produce FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_quality_assessments_inspector FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_quality_assessments_request FOREIGN KEY (inspection_request_id) REFERENCES inspection_requests(id) ON DELETE CASCADE;

ALTER TABLE inspection_requests
  ADD CONSTRAINT fk_inspection_requests_produce FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_inspection_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_inspection_requests_inspector FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE offers
  ADD CONSTRAINT fk_offers_produce FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_offers_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_offers_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE;

ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_transactions_produce FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_transactions_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_transactions_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE;

ALTER TABLE buyer_preferences
  ADD CONSTRAINT fk_buyer_preferences_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE support_tickets
  ADD CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE daily_prices
  ADD CONSTRAINT fk_daily_prices_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE;

ALTER TABLE ratings
  ADD CONSTRAINT fk_ratings_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ratings_rating_user FOREIGN KEY (rating_user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ratings_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bank_accounts
  ADD CONSTRAINT fk_bank_accounts_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE produce
  ADD CONSTRAINT check_produce_quantity CHECK (quantity > 0),
  ADD CONSTRAINT check_price_per_unit CHECK (price_per_unit >= 0),
  ADD CONSTRAINT check_inspection_fee CHECK (inspection_fee >= 0);

ALTER TABLE offers
  ADD CONSTRAINT check_price_per_unit CHECK (price_per_unit >= 0),
  ADD CONSTRAINT check_quantity CHECK (quantity > 0),
  ADD CONSTRAINT check_distance CHECK (distance_km >= 0),
  ADD CONSTRAINT check_inspection_fee CHECK (inspection_fee >= 0);

ALTER TABLE transactions
  ADD CONSTRAINT check_final_price CHECK (final_price >= 0),
  ADD CONSTRAINT check_final_quantity CHECK (final_quantity > 0);

ALTER TABLE quality_assessments
  ADD CONSTRAINT check_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 100);

ALTER TABLE daily_prices
  ADD CONSTRAINT check_min_price CHECK (min_price >= 0),
  ADD CONSTRAINT check_max_price CHECK (max_price >= min_price),
  ADD CONSTRAINT check_minimum_quantity CHECK (minimum_quantity > 0);

ALTER TABLE business_metrics
  ADD CONSTRAINT check_processing_time CHECK (processing_time >= 0),
  ADD CONSTRAINT check_value CHECK (value >= 0);

ALTER TABLE inspection_distance_fee_config
  ADD CONSTRAINT check_min_distance CHECK (min_distance >= 0),
  ADD CONSTRAINT check_max_distance CHECK (max_distance > min_distance),
  ADD CONSTRAINT check_fee CHECK (fee >= 0);

-- Create indexes for performance
CREATE INDEX idx_users_mobile_number ON users(mobile_number);
CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX idx_produce_farmer_id ON produce(farmer_id);
CREATE INDEX idx_produce_farm_id ON produce(farm_id);
CREATE INDEX idx_produce_status ON produce(status);
CREATE INDEX idx_produce_category ON produce(produce_category);
CREATE INDEX idx_produce_location ON produce(location);
CREATE INDEX idx_produce_assigned_inspector ON produce(assigned_inspector);
CREATE INDEX idx_produce_farmer_status ON produce(farmer_id, status);
CREATE INDEX idx_produce_category_status ON produce(produce_category, status);

CREATE INDEX idx_quality_assessments_produce ON quality_assessments(produce_id);
CREATE INDEX idx_quality_assessments_inspector ON quality_assessments(inspector_id);
CREATE INDEX idx_quality_assessments_request ON quality_assessments(inspection_request_id);

CREATE INDEX idx_inspection_requests_produce ON inspection_requests(produce_id);
CREATE INDEX idx_inspection_requests_inspector ON inspection_requests(inspector_id);

CREATE INDEX idx_offers_produce_id ON offers(produce_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_farmer_id ON offers(farmer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_status_valid_until ON offers(status, valid_until);
CREATE INDEX idx_offers_farmer_status ON offers(farmer_id, status);
CREATE INDEX idx_offers_produce_status ON offers(produce_id, status);
CREATE INDEX idx_offers_auto_generated ON offers(is_auto_generated);

CREATE INDEX idx_transactions_offer_id ON transactions(offer_id);
CREATE INDEX idx_transactions_produce_id ON transactions(produce_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_dates ON transactions(delivery_window_starts_at, delivery_window_ends_at);
CREATE INDEX idx_transactions_rating ON transactions(requires_rating, rating_completed);

CREATE INDEX idx_buyer_preferences_buyer_id ON buyer_preferences(buyer_id);

CREATE INDEX idx_media_entity ON media(entity_id);
CREATE INDEX idx_media_user ON media(user_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_completed_at ON reports(completed_at);
CREATE INDEX idx_reports_scheduled_time ON reports(scheduled_time);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to_id);

CREATE INDEX idx_daily_prices_buyer_id ON daily_prices(buyer_id);
CREATE INDEX idx_daily_prices_category ON daily_prices(produce_category);
CREATE INDEX idx_daily_prices_validity ON daily_prices(valid_from, valid_until);
CREATE INDEX idx_daily_prices_buyer_category ON daily_prices(buyer_id, produce_category);

CREATE INDEX idx_business_metrics_type ON business_metrics(type);
CREATE INDEX idx_business_metrics_user ON business_metrics(user_id);
CREATE INDEX idx_business_metrics_type_date ON business_metrics(type, created_at);
CREATE INDEX idx_business_metrics_entity ON business_metrics(entity_type, entity_id);

CREATE INDEX idx_ratings_transaction ON ratings(transaction_id);
CREATE INDEX idx_ratings_users ON ratings(rating_user_id, rated_user_id);

CREATE INDEX idx_bank_accounts_farmer ON bank_accounts(farmer_id);

-- Create triggers for timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produce_updated_at
    BEFORE UPDATE ON produce
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_assessments_updated_at
    BEFORE UPDATE ON quality_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_requests_updated_at
    BEFORE UPDATE ON inspection_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at
    BEFORE UPDATE ON buyers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_preferences_updated_at
    BEFORE UPDATE ON buyer_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_prices_updated_at
    BEFORE UPDATE ON daily_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_metrics_updated_at
    BEFORE UPDATE ON business_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update media table
ALTER TABLE media
ADD COLUMN type media_type_enum NOT NULL DEFAULT 'IMAGE',
ADD COLUMN entity_category media_category_enum;

-- Update notifications table
ALTER TABLE notifications
ADD COLUMN read_at TIMESTAMP;

-- Update support_tickets table
ALTER TABLE support_tickets
ADD COLUMN priority support_priority_enum NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN category support_category_enum NOT NULL,
ADD COLUMN attachments TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update users table
ALTER TABLE users
ADD COLUMN metadata JSONB,
ADD COLUMN profile JSONB,
ADD COLUMN roles user_role_enum[] DEFAULT ARRAY['BUYER']::user_role_enum[],
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN is_farmer BOOLEAN DEFAULT FALSE,
ADD COLUMN is_buyer BOOLEAN DEFAULT FALSE,
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN is_quality_inspector BOOLEAN DEFAULT FALSE;

-- Add missing indexes
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_entity_category ON media(entity_category);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_users_roles ON users(roles);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_users_is_blocked ON users(is_blocked);
CREATE INDEX idx_users_is_farmer ON users(is_farmer);
CREATE INDEX idx_users_is_buyer ON users(is_buyer);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_is_quality_inspector ON users(is_quality_inspector);

-- Create transaction history table
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  event transaction_event_enum NOT NULL,
  old_status transactions_status_enum,
  new_status transactions_status_enum,
  user_id UUID NOT NULL REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for transaction history
CREATE INDEX idx_transaction_history_transaction ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_event ON transaction_history(event);
CREATE INDEX idx_transaction_history_user ON transaction_history(user_id);
CREATE INDEX idx_transaction_history_created ON transaction_history(created_at);

-- Add trigger for transaction history timestamp update
CREATE TRIGGER update_transaction_history_updated_at
    BEFORE UPDATE ON transaction_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TABLE IF EXISTS produce_synonyms CASCADE;

CREATE TABLE produce_synonyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produce_name TEXT NOT NULL,
    synonym TEXT NOT NULL,
    language VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    is_ai_generated BOOLEAN DEFAULT false,
    confidence_score DECIMAL(5,2),
    last_validated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produce_synonyms_produce_name ON produce_synonyms(produce_name);
CREATE INDEX idx_produce_synonyms_synonym ON produce_synonyms(synonym);
CREATE INDEX idx_produce_synonyms_is_active ON produce_synonyms(is_active);
CREATE INDEX idx_produce_synonyms_last_validated_at ON produce_synonyms(last_validated_at);

CREATE OR REPLACE FUNCTION update_produce_synonyms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produce_synonyms_updated_at
    BEFORE UPDATE ON produce_synonyms
    FOR EACH ROW
    EXECUTE FUNCTION update_produce_synonyms_updated_at();

CREATE TABLE inspection_base_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produce_category produce_category_enum NOT NULL,
    inspection_base_fee DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_inspection_base_fee_config_produce_category ON inspection_base_fee_config(produce_category);
CREATE INDEX idx_inspection_base_fee_config_is_active ON inspection_base_fee_config(is_active);

CREATE OR REPLACE FUNCTION update_inspection_base_fee_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspection_base_fee_config_updated_at
    BEFORE UPDATE ON inspection_base_fee_config
    FOR EACH ROW
    EXECUTE FUNCTION update_inspection_base_fee_config_updated_at();

DROP TABLE IF EXISTS system_configs CASCADE;

CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key system_config_key_enum NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_configs_key ON system_configs(key);
CREATE INDEX idx_system_configs_is_active ON system_configs(is_active);

CREATE OR REPLACE FUNCTION update_system_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_configs_updated_at
    BEFORE UPDATE ON system_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_system_configs_updated_at();

DROP TABLE IF EXISTS config_audit_logs CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;

CREATE TABLE config_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key system_config_key_enum NOT NULL,
    old_value JSONB,
    new_value JSONB NOT NULL,
    updated_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_config_audit_logs_config_key ON config_audit_logs(config_key);
CREATE INDEX idx_config_audit_logs_updated_by ON config_audit_logs(updated_by);
CREATE INDEX idx_config_audit_logs_created_at ON config_audit_logs(created_at);

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action admin_action_type_enum NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB NOT NULL,
    entity_type TEXT,
    ip_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_entity_id ON admin_audit_logs(entity_id);
CREATE INDEX idx_admin_audit_logs_entity_type ON admin_audit_logs(entity_type);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

CREATE OR REPLACE FUNCTION update_admin_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_audit_logs_updated_at
    BEFORE UPDATE ON admin_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_audit_logs_updated_at();

-- Create inspectors table
CREATE TABLE inspectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Report table
CREATE TABLE IF NOT EXISTS report (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  report_type report_type_enum NOT NULL,
  format report_format_enum NOT NULL,
  status report_status_enum NOT NULL DEFAULT 'DRAFT',
  parameters JSONB,
  file_url VARCHAR(255),
  file_size INTEGER,
  summary TEXT,
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for Report table
CREATE INDEX IF NOT EXISTS idx_report_user_id ON report(user_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON report(status);
CREATE INDEX IF NOT EXISTS idx_report_scheduled_time ON report(scheduled_time);

-- Create request_metrics table
CREATE TABLE IF NOT EXISTS request_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- End of file