-- ==============================================================================
-- SLOTH Dispatch Operating System & Logistics Hub - Migration 000001_init.sql
-- Database: PostgreSQL 14+
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'DISPATCHER',
  'SAFETY_OFFICER',
  'ACCOUNTING',
  'DRIVER'
);

CREATE TYPE driver_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE trailer_type AS ENUM (
  'DRY_VAN',
  'REEFER',
  'FLATBED',
  'STEP_DECK',
  'POWER_ONLY'
);

CREATE TYPE trailer_status AS ENUM (
  'AVAILABLE',
  'ATTACHED',
  'MAINTENANCE',
  'OUT_OF_SERVICE'
);

CREATE TYPE load_status AS ENUM (
  'READY',
  'DISPATCHED',
  'RESERVED',
  'TRANSIT',
  'ATTENTION',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE priority_flag AS ENUM (
  'NONE',
  'NORMAL',
  'WARNING_YELLOW',
  'EMERGENCY_RED'
);

CREATE TYPE stop_type AS ENUM (
  'PICKUP',
  'DELIVERY',
  'DROP_YARD'
);

CREATE TYPE engine_state AS ENUM (
  'OFF',
  'IDLE',
  'MOVING'
);

CREATE TYPE telegram_direction AS ENUM (
  'INBOUND',
  'OUTBOUND'
);

CREATE TYPE telegram_message_type AS ENUM (
  'TEXT',
  'PHOTO',
  'LOCATION',
  'BUTTON_ACTION'
);

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- Companies (Multi-Tenant Root)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  mc_number VARCHAR(64) NOT NULL,
  dot_number VARCHAR(64) NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users (Dispatchers, Admins, Safety)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'DISPATCHER',
  preferences JSONB DEFAULT '{"theme":"dark","density":"compact","hiddenColumns":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_company_role ON users(company_id, role);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  telegram_chat_id VARCHAR(64) UNIQUE,
  license_number VARCHAR(128) NOT NULL,
  is_solo BOOLEAN NOT NULL DEFAULT true,
  status driver_status NOT NULL DEFAULT 'ACTIVE',
  hometime_pref VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_drivers_company_status ON drivers(company_id, status);
CREATE INDEX idx_drivers_telegram_chat ON drivers(telegram_chat_id);

-- Trucks
CREATE TABLE trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_number VARCHAR(64) NOT NULL,
  vin VARCHAR(64) NOT NULL UNIQUE,
  plate VARCHAR(64),
  default_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  telematics_device_id VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_trucks_company_unit UNIQUE(company_id, unit_number)
);
CREATE INDEX idx_trucks_telematics_device ON trucks(telematics_device_id);

-- Trailers
CREATE TABLE trailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trailer_number VARCHAR(64) NOT NULL,
  type trailer_type NOT NULL DEFAULT 'DRY_VAN',
  status trailer_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_trailers_company_number UNIQUE(company_id, trailer_number)
);

-- Loads (Core Dispatch Entity)
CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  load_number VARCHAR(64) NOT NULL,
  broker_name VARCHAR(255) NOT NULL,
  rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status load_status NOT NULL DEFAULT 'READY',
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  trailer_id UUID REFERENCES trailers(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  priority_flag priority_flag NOT NULL DEFAULT 'NONE',
  deadhead_miles INTEGER NOT NULL DEFAULT 0,
  loaded_miles INTEGER NOT NULL DEFAULT 0,
  public_token VARCHAR(128) UNIQUE,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_loads_company_status ON loads(company_id, status);
CREATE INDEX idx_loads_company_priority ON loads(company_id, priority_flag);
CREATE INDEX idx_loads_number ON loads(load_number);
CREATE INDEX idx_loads_public_token ON loads(public_token);

-- Stops (Multi-Stop Pickups & Deliveries)
CREATE TABLE stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  stop_type stop_type NOT NULL,
  sequence_order INTEGER NOT NULL,
  facility_name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(32) NOT NULL,
  zip VARCHAR(32),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  scheduled_time TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  bol_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stops_load_sequence ON stops(load_id, sequence_order);

-- Telematics Logs (High-Volume GPS Time-Series)
CREATE TABLE telematics_logs (
  id BIGSERIAL PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_mph DOUBLE PRECISION NOT NULL,
  odometer INTEGER NOT NULL,
  engine_state engine_state NOT NULL DEFAULT 'MOVING',
  calculated_miles_left INTEGER,
  remaining_drive_seconds INTEGER,
  ping_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_telematics_truck_timestamp ON telematics_logs(truck_id, ping_timestamp DESC);

-- Telegram Message Logs (Driver Chat History & BOL Uploads)
CREATE TABLE telegram_message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
  direction telegram_direction NOT NULL,
  message_text TEXT NOT NULL,
  media_url TEXT,
  message_type telegram_message_type NOT NULL DEFAULT 'TEXT',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_telegram_driver_created ON telegram_message_logs(driver_id, created_at DESC);
CREATE INDEX idx_telegram_load ON telegram_message_logs(load_id);
