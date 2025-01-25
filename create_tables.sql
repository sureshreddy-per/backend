-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, handle enum dependencies

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
DROP TABLE IF EXISTS notification_preferences CASCADE;
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

-- Drop all enums with CASCADE to ensure all dependencies are removed
-- Removing all enum drops since we're using TEXT

-- Create all tables first (in dependency order)
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    mobile_number TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'FARMER',
    status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    block_reason TEXT,
    fcm_token TEXT,
    avatar_url TEXT,
    login_attempts INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_completed_transactions INTEGER DEFAULT 0,
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

DROP TABLE IF EXISTS produce CASCADE;

CREATE TABLE produce (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    farm_id UUID REFERENCES farms(id),
    name TEXT NOT NULL,
    description TEXT,
    product_variety TEXT,
    produce_category TEXT,
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
    status TEXT DEFAULT 'PENDING_AI_ASSESSMENT',
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

CREATE TABLE inspection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produce_id UUID NOT NULL REFERENCES produce(id),
  requester_id UUID NOT NULL REFERENCES users(id),
  inspector_id UUID REFERENCES users(id),
  location TEXT NOT NULL,
  inspection_fee DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  scheduled_at TIMESTAMP,
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspection_requests_produce FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
  CONSTRAINT fk_inspection_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_inspection_requests_inspector FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL
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
    category TEXT NOT NULL,
    category_specific_assessment JSONB NOT NULL,
    source TEXT NOT NULL DEFAULT 'AI',
    inspector_id UUID REFERENCES users(id),
    inspection_request_id UUID REFERENCES inspection_requests(id),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 100)
);

-- Add indexes for quality_assessments
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
  location TEXT,
  location_name TEXT,
  address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_business_name ON buyers(business_name);
CREATE INDEX idx_buyers_is_active ON buyers(is_active);
CREATE INDEX idx_buyers_location ON buyers(location);

-- Add constraint to ensure location uses comma format
ALTER TABLE buyers
ADD CONSTRAINT check_location_format CHECK (location ~ '^-?\d+(\.\d+)?,-?\d+(\.\d+)?$');

CREATE TABLE buyer_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  produce_names TEXT[] DEFAULT '{}',
  produce_price_preferences JSONB DEFAULT '[]',
  notification_enabled BOOLEAN DEFAULT true,
  notification_methods TEXT[] DEFAULT '{"PUSH"}',
  last_price_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_buyer_preferences UNIQUE (buyer_id)
);

CREATE INDEX idx_buyer_preferences_buyer_id ON buyer_preferences(buyer_id);
CREATE INDEX idx_buyer_preferences_produce_names ON buyer_preferences USING GIN (produce_names);
CREATE INDEX idx_buyer_preferences_price_preferences ON buyer_preferences USING GIN (produce_price_preferences);

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
    status TEXT NOT NULL DEFAULT 'PENDING',
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
    status TEXT NOT NULL DEFAULT 'PENDING',
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

-- Create transaction history table for tracking all changes
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_event CHECK (
    event IN (
      'CREATED',
      'STATUS_CHANGED',
      'DELIVERY_WINDOW_STARTED',
      'DELIVERY_CONFIRMED',
      'INSPECTION_COMPLETED',
      'CANCELLED',
      'EXPIRED',
      'RATING_ADDED'
    )
  )
);

-- Add indexes for transaction history
CREATE INDEX idx_transaction_history_transaction ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_event ON transaction_history(event);
CREATE INDEX idx_transaction_history_user ON transaction_history(user_id);
CREATE INDEX idx_transaction_history_created ON transaction_history(created_at);

-- Add triggers for timestamp updates
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

CREATE OR REPLACE FUNCTION update_transaction_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transaction_history_updated_at
    BEFORE UPDATE ON transaction_history
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_history_updated_at();

-- Add check constraints
ALTER TABLE produce
    ADD CONSTRAINT check_produce_quantity CHECK (quantity > 0);

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
    type TEXT NOT NULL DEFAULT 'IMAGE',
    mime_type TEXT,
    size INTEGER,
    original_name TEXT,
    metadata JSONB,
    entity_category TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

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
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  notification_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_notification_preferences UNIQUE (user_id)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_notification_types ON notification_preferences USING gin(notification_types);

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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
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
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  category TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
  attachments TEXT[] DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_min_price CHECK (min_price >= 0),
    CONSTRAINT check_max_price CHECK (max_price >= min_price),
    CONSTRAINT check_average_price CHECK (average_price >= min_price AND average_price <= max_price)
);

CREATE INDEX idx_daily_prices_produce_name ON daily_prices(produce_name);
CREATE INDEX idx_daily_prices_market_name ON daily_prices(market_name);
CREATE INDEX idx_daily_prices_created_at ON daily_prices(created_at);
CREATE INDEX idx_daily_prices_metadata ON daily_prices USING gin(metadata);

CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_business_metrics_type ON business_metrics(type);
CREATE INDEX idx_business_metrics_category ON business_metrics(category);
CREATE INDEX idx_business_metrics_period ON business_metrics(period_start, period_end);
CREATE INDEX idx_business_metrics_data ON business_metrics USING gin(data);

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

-- Drop event_metrics if it exists
DROP TABLE IF EXISTS event_metrics CASCADE;

-- Create event_metrics table
CREATE TABLE IF NOT EXISTS event_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  user_id VARCHAR(255),
  entity_id VARCHAR(255),
  entity_type VARCHAR(255),
  processing_time NUMERIC,
  value DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for event_metrics
CREATE INDEX IF NOT EXISTS idx_event_metrics_type ON event_metrics(type);
CREATE INDEX IF NOT EXISTS idx_event_metrics_created_at ON event_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_event_metrics_user_id ON event_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_event_metrics_entity_id ON event_metrics(entity_id);
CREATE INDEX IF NOT EXISTS idx_event_metrics_metadata ON event_metrics USING gin(metadata);

DROP TABLE IF EXISTS ratings CASCADE;

CREATE TABLE ratings (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE ratings
  ADD CONSTRAINT fk_ratings_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ratings_rating_user FOREIGN KEY (rating_user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ratings_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bank_accounts
  ADD CONSTRAINT fk_bank_accounts_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_produce_category ON produce(produce_category);
CREATE INDEX idx_produce_farmer_status ON produce(farmer_id, status);
CREATE INDEX idx_produce_category_status ON produce(produce_category, status);

CREATE INDEX idx_quality_assessments_produce ON quality_assessments(produce_id);
CREATE INDEX idx_quality_assessments_inspector ON quality_assessments(inspector_id);
CREATE INDEX idx_quality_assessments_request ON quality_assessments(inspection_request_id);

CREATE INDEX idx_inspection_requests_produce ON inspection_requests(produce_id);
CREATE INDEX idx_inspection_requests_inspector ON inspection_requests(inspector_id);

CREATE INDEX idx_offers_status_valid_until ON offers(status, valid_until);
CREATE INDEX idx_offers_farmer_status ON offers(farmer_id, status);
CREATE INDEX idx_offers_produce_status ON offers(produce_id, status);
CREATE INDEX idx_offers_auto_generated ON offers(is_auto_generated);

CREATE INDEX idx_transactions_dates ON transactions(delivery_window_starts_at, delivery_window_ends_at);

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

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_prices_updated_at
    BEFORE UPDATE ON daily_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Update support_tickets table
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES users(id);

-- Add missing indexes
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_entity_category ON media(entity_category);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);

-- Create transaction history table
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
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
    validation_count INTEGER DEFAULT 0,
    positive_validations INTEGER DEFAULT 0,
    negative_validations INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    region TEXT,
    season TEXT,
    market_context TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produce_synonyms_produce_name ON produce_synonyms(produce_name);
CREATE INDEX idx_produce_synonyms_synonym ON produce_synonyms(synonym);
CREATE INDEX idx_produce_synonyms_is_active ON produce_synonyms(is_active);
CREATE INDEX idx_produce_synonyms_last_validated_at ON produce_synonyms(last_validated_at);
CREATE INDEX idx_produce_synonyms_validation_count ON produce_synonyms(validation_count);
CREATE INDEX idx_produce_synonyms_usage_count ON produce_synonyms(usage_count);
CREATE INDEX idx_produce_synonyms_region ON produce_synonyms(region);
CREATE INDEX idx_produce_synonyms_season ON produce_synonyms(season);

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
    produce_category TEXT NOT NULL,
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
    key TEXT NOT NULL UNIQUE,
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
    config_key TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB NOT NULL,
    updated_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB NOT NULL,
    entity_type TEXT,
    ip_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Report table
CREATE TABLE IF NOT EXISTS report (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  report_type TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
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

-- Add constraint to ensure lat_lng uses comma format
ALTER TABLE buyers
ADD CONSTRAINT check_lat_lng_format CHECK (location ~ '^-?\d+(\.\d+)?,-?\d+(\.\d+)?$');

-- Fix media table
ALTER TABLE media
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IMAGE',
ADD COLUMN IF NOT EXISTS entity_category TEXT;

-- Fix support_tickets table
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES users(id);

-- Fix location constraint for buyers
ALTER TABLE buyers
DROP CONSTRAINT IF EXISTS check_location_format,
ADD CONSTRAINT check_location_format CHECK (location ~ '^-?\d+(\.\d+)?,-?\d+(\.\d+)?$');

-- Drop and recreate inspectors table to avoid conflicts
DROP TABLE IF EXISTS inspectors CASCADE;
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

-- Fix report table indexes
CREATE INDEX IF NOT EXISTS idx_report_user_id ON report(user_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON report(status);
CREATE INDEX IF NOT EXISTS idx_report_scheduled_time ON report(scheduled_time);

-- Drop and recreate indexes with IF NOT EXISTS
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_support_tickets_user_id;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_report_status;

-- Fix notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Fix media table
ALTER TABLE media
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IMAGE',
ADD COLUMN IF NOT EXISTS entity_category TEXT;

-- Fix support_tickets table
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES users(id);

-- Fix report table
ALTER TABLE report
ADD COLUMN IF NOT EXISTS status TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_report_status ON report(status);

-- Create notification_preferences table
DROP TABLE IF EXISTS notification_preferences CASCADE;

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  notification_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_notification_preferences UNIQUE (user_id)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_notification_types ON notification_preferences USING gin(notification_types);

-- Update buyer_preferences table
ALTER TABLE buyer_preferences
ADD COLUMN IF NOT EXISTS produce_price_preferences JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_price_updated TIMESTAMP WITH TIME ZONE;

-- Update support_tickets table to use TEXT instead of enums
ALTER TABLE support_tickets
ALTER COLUMN status TYPE TEXT,
ALTER COLUMN priority TYPE TEXT,
ALTER COLUMN category TYPE TEXT;

-- Update produce table to use TEXT
ALTER TABLE produce
ALTER COLUMN produce_category TYPE TEXT;

-- Update notifications table to use TEXT
ALTER TABLE notifications
ALTER COLUMN type TYPE TEXT;

-- Remove enum-related constraints from notification_preferences
ALTER TABLE notification_preferences
DROP CONSTRAINT IF EXISTS check_valid_notification_types;

-- Remove notification type validation trigger
DROP TRIGGER IF EXISTS validate_notification_types_trigger ON notification_preferences;
DROP FUNCTION IF EXISTS validate_notification_types();

-- Remove enum creation blocks
-- Remove all DO $$ BEGIN CREATE TYPE ... END $$ blocks

-- Remove all duplicate index creations
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_support_tickets_user_id;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_media_entity_category;
DROP INDEX IF EXISTS idx_report_user_id;
DROP INDEX IF EXISTS idx_report_status;
DROP INDEX IF EXISTS idx_report_scheduled_time;

-- Create indexes only once
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_media_entity_category ON media(entity_category);
CREATE INDEX IF NOT EXISTS idx_report_user_id ON report(user_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON report(status);
CREATE INDEX IF NOT EXISTS idx_report_scheduled_time ON report(scheduled_time);

-- Remove all duplicate trigger creations
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_farmers_updated_at ON farmers;
DROP TRIGGER IF EXISTS update_farms_updated_at ON farms;
DROP TRIGGER IF EXISTS update_produce_updated_at ON produce;
DROP TRIGGER IF EXISTS update_quality_assessments_updated_at ON quality_assessments;
DROP TRIGGER IF EXISTS update_inspection_requests_updated_at ON inspection_requests;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS update_business_metrics_updated_at ON business_metrics;

-- Create triggers only once
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

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_metrics_updated_at
    BEFORE UPDATE ON business_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Remove duplicate table creations
DROP TABLE IF EXISTS inspectors CASCADE;
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS request_metrics CASCADE;

-- Create tables only once
CREATE TABLE IF NOT EXISTS inspectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    report_type TEXT NOT NULL,
    format TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
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

CREATE TABLE IF NOT EXISTS request_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a view for transformed inspection requests
CREATE OR REPLACE VIEW inspection_requests_view AS
SELECT 
  ir.id,
  ir.produce_id,
  ir.requester_id,
  ir.inspector_id,
  ir.location,
  ir.inspection_fee,
  ir.status,
  ir.scheduled_at,
  ir.assigned_at,
  ir.completed_at,
  ir.notes,
  ir.created_at,
  ir.updated_at,
  -- Produce details
  jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'images', p.images,
    'location', p.location,
    'quality_grade', p.quality_grade,
    'quality_assessments', (
      SELECT jsonb_agg(qa.*)
      FROM quality_assessments qa
      WHERE qa.produce_id = p.id
      ORDER BY qa.created_at DESC
    )
  ) as produce,
  -- Inspector details
  CASE WHEN i.id IS NOT NULL THEN
    jsonb_build_object(
      'id', i.id,
      'name', i.name,
      'mobile_number', i.mobile_number,
      'location', i.location
    )
  ELSE NULL END as inspector
FROM inspection_requests ir
LEFT JOIN produce p ON ir.produce_id = p.id
LEFT JOIN inspectors i ON ir.inspector_id = i.user_id;