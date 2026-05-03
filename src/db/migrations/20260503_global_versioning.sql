-- Migration: 20260503_global_versioning.sql
-- Goal: Implement Global Optimistic Concurrency Control (OCC) via server-side versioning.

-- 1. Create a generic function to increment version and update timestamp
CREATE OR REPLACE FUNCTION fn_touch_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = COALESCE(OLD.version, 0) + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add 'version' column to core tables that are missing it
DO $$ 
BEGIN
    -- Inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'version') THEN
        ALTER TABLE inventory ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Equipment Bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_bookings' AND column_name = 'version') THEN
        ALTER TABLE equipment_bookings ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Campaigns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'version') THEN
        ALTER TABLE campaigns ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'version') THEN
        ALTER TABLE profiles ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Leave Requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'version') THEN
        ALTER TABLE leave_requests ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Departments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'version') THEN
        ALTER TABLE departments ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Files
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'version') THEN
        ALTER TABLE files ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'updated_at') THEN
        ALTER TABLE files ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Drive Queue
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drive_queue' AND column_name = 'version') THEN
        ALTER TABLE drive_queue ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drive_queue' AND column_name = 'updated_at') THEN
        ALTER TABLE drive_queue ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Inventory Requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_requests' AND column_name = 'version') THEN
        ALTER TABLE inventory_requests ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- User Leave Balances
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_leave_balances' AND column_name = 'version') THEN
        ALTER TABLE user_leave_balances ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- 3. Attach Triggers
-- Drop first to ensure idempotency
DROP TRIGGER IF EXISTS tr_touch_version_tasks ON tasks;
CREATE TRIGGER tr_touch_version_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_events ON events;
CREATE TRIGGER tr_touch_version_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_inventory ON inventory;
CREATE TRIGGER tr_touch_version_inventory BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_equipment_bookings ON equipment_bookings;
CREATE TRIGGER tr_touch_version_equipment_bookings BEFORE UPDATE ON equipment_bookings FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_campaigns ON campaigns;
CREATE TRIGGER tr_touch_version_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_profiles ON profiles;
CREATE TRIGGER tr_touch_version_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_leave_requests ON leave_requests;
CREATE TRIGGER tr_touch_version_leave_requests BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_files ON files;
CREATE TRIGGER tr_touch_version_files BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION fn_touch_version();

DROP TRIGGER IF EXISTS tr_touch_version_inventory_requests ON inventory_requests;
CREATE TRIGGER tr_touch_version_inventory_requests BEFORE UPDATE ON inventory_requests FOR EACH ROW EXECUTE FUNCTION fn_touch_version();
