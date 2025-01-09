-- Drop existing tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS produce CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS farms CASCADE;

-- Create enum types
CREATE TYPE user_role_enum AS ENUM (
  'ADMIN',
  'FARMER',
  'BUYER',
  'INSPECTOR',
);

CREATE TYPE user_status_enum AS ENUM (
  'PENDING_VERIFICATION',
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
  'DELETED'
);

CREATE TYPE produce_category_enum AS ENUM (
  'Food Grains',
  'Oilseeds',
  'Fruits',
  'Vegetables',
  'Spices',
  'Fibers',
  'Sugarcane',
  'Flowers',
  'Medicinal and Aromatic Plants'
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
  'A',
  'B',
  'C',
  'D',
  'F'
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'USER',
  status user_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
  block_reason TEXT,
  fcm_token TEXT,
  avatar_url TEXT,
  login_attempts INTEGER DEFAULT 0,
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
  location TEXT,
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