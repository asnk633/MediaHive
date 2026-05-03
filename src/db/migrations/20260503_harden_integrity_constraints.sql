-- 1. Harden Inventory Quantity
ALTER TABLE inventory ADD CONSTRAINT quantity_non_negative CHECK (quantity >= 0);
ALTER TABLE equipment_bookings ADD CONSTRAINT units_positive CHECK (units_requested > 0);

-- 2. Normalize tenant_id in HR tables (if not already UUID)
DO $$ 
BEGIN 
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'tenant_id') = 'text' THEN
        ALTER TABLE leave_requests ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
    END IF;
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'user_leave_balances' AND column_name = 'tenant_id') = 'text' THEN
        ALTER TABLE user_leave_balances ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;
    END IF;
END $$;

-- 3. Status Transition Guard for Leave Requests
CREATE OR REPLACE FUNCTION check_leave_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changes to approved/rejected requests except for specific admin updates
    IF OLD.status IN ('approved', 'rejected') AND NEW.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot cancel a request that has already been %', OLD.status;
    END IF;
    
    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        RAISE EXCEPTION 'Cannot reactivate a cancelled request';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if trigger already exists to avoid errors on re-run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_guard_leave_status') THEN
        CREATE TRIGGER tr_guard_leave_status
        BEFORE UPDATE OF status ON leave_requests
        FOR EACH ROW EXECUTE FUNCTION check_leave_status_transition();
    END IF;
END $$;
