-- MediaHive: Inventory Table Hardening
-- Date: 2026-03-15
-- Description: Adds missing columns to inventory table to match schema.ts and support stats/management.

DO $$ 
BEGIN
    -- Core Management Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'category') THEN
        ALTER TABLE inventory ADD COLUMN category TEXT NOT NULL DEFAULT 'uncategorized';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'unit') THEN
        ALTER TABLE inventory ADD COLUMN unit TEXT NOT NULL DEFAULT 'unit';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'status') THEN
        ALTER TABLE inventory ADD COLUMN status TEXT NOT NULL DEFAULT 'available';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'threshold') THEN
        ALTER TABLE inventory ADD COLUMN threshold INTEGER DEFAULT 0;
    END IF;

    -- Analytics & Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'serial_number') THEN
        ALTER TABLE inventory ADD COLUMN serial_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'condition') THEN
        ALTER TABLE inventory ADD COLUMN condition TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'asset_status') THEN
        ALTER TABLE inventory ADD COLUMN asset_status TEXT;
    END IF;

    -- Financial & Rental
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'is_rentable') THEN
        ALTER TABLE inventory ADD COLUMN is_rentable BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'rental_rate_per_day') THEN
        ALTER TABLE inventory ADD COLUMN rental_rate_per_day NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'purchase_price') THEN
        ALTER TABLE inventory ADD COLUMN purchase_price NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'purchase_date') THEN
        ALTER TABLE inventory ADD COLUMN purchase_date DATE;
    END IF;

    -- Media & Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'image_url') THEN
        ALTER TABLE inventory ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'drive_file_id') THEN
        ALTER TABLE inventory ADD COLUMN drive_file_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'images') THEN
        ALTER TABLE inventory ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Metadata & Remarks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'location_str') THEN
        ALTER TABLE inventory ADD COLUMN location_str TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'brand') THEN
        ALTER TABLE inventory ADD COLUMN brand TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'model') THEN
        ALTER TABLE inventory ADD COLUMN model TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'notes') THEN
        ALTER TABLE inventory ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'remarks') THEN
        ALTER TABLE inventory ADD COLUMN remarks TEXT;
    END IF;

    -- Audit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'created_by') THEN
        ALTER TABLE inventory ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'updated_at') THEN
        ALTER TABLE inventory ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

END $$;
