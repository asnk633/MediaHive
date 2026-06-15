-- ============================================================
-- Migration: Presence Verification & Field Work Mode
-- Date: 2026-06-15
-- Description: Adds continuous presence verification logging,
--   field work session tracking with manager approval workflow,
--   and organization-level verification settings.
-- NOTE: Column names use camelCase to match existing Supabase schema
-- ============================================================

-- ============================================================
-- 1. PRESENCE VERIFICATION SETTINGS (Org-level config)
--    Includes shadowMode for safe rollout (Phase 0)
-- ============================================================
CREATE TABLE IF NOT EXISTS presence_verification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL UNIQUE,
  "isEnabled" BOOLEAN DEFAULT true,
  "shadowMode" BOOLEAN DEFAULT true,               -- Phase 0: log violations but don't enforce
  "checkIntervalMinutes" INTEGER DEFAULT 10,
  "gracePeriodMinutes" INTEGER DEFAULT 5,
  "autoCheckoutOnViolation" BOOLEAN DEFAULT false,
  "maxFieldWorkHours" DOUBLE PRECISION DEFAULT 4.0,
  "geofenceRadiusMeters" INTEGER DEFAULT 150,
  "requireWifiVerification" BOOLEAN DEFAULT false,
  "officeWifiSsids" TEXT[],                         -- Array of approved SSIDs
  -- Battery management policy
  "lowBatteryIntervalMinutes" INTEGER DEFAULT 15,   -- Reduce polling when battery < 20%
  "criticalBatterySuspend" BOOLEAN DEFAULT true,    -- Suspend verification at < 10%
  -- Manager fallback
  "autoApproveTimeoutMinutes" INTEGER DEFAULT 30,   -- Auto-approve field work if no manager response
  "rejectionGracePeriodMinutes" INTEGER DEFAULT 15, -- Grace period before auto-checkout on rejection
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ
);

COMMENT ON COLUMN presence_verification_settings."shadowMode" IS 'When true, system logs violations but does NOT enforce. Use for 1-2 week calibration period.';
COMMENT ON COLUMN presence_verification_settings."lowBatteryIntervalMinutes" IS 'Polling interval when device battery < 20%. Reduces battery drain.';
COMMENT ON COLUMN presence_verification_settings."rejectionGracePeriodMinutes" IS 'After manager rejects field work, user gets this many minutes to return before auto-checkout.';

-- ============================================================
-- 2. PRESENCE LOGS
--    Periodic location verification records with networkState
-- ============================================================
CREATE TABLE IF NOT EXISTS presence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "attendanceId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,                        -- GPS accuracy in meters
  "isWithinGeofence" BOOLEAN NOT NULL DEFAULT true,
  "isMockLocation" BOOLEAN DEFAULT false,           -- Anti-spoofing flag
  "wifiSsid" TEXT,                                  -- Connected WiFi SSID if detected
  "verificationMethod" TEXT DEFAULT 'gps',           -- 'gps', 'wifi', 'geofence', 'hybrid', 'failed'
  "distanceFromOffice" DOUBLE PRECISION,             -- Distance in meters from office
  "networkState" TEXT DEFAULT 'online',              -- 'online', 'offline', 'weak'
  "batteryLevel" INTEGER,                            -- Device battery percentage at time of check
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_logs_attendance ON presence_logs("attendanceId");
CREATE INDEX IF NOT EXISTS idx_presence_logs_member_time ON presence_logs("userId", "createdAt" DESC);

COMMENT ON TABLE presence_logs IS 'Periodic GPS/WiFi verification records logged every N minutes during active attendance sessions.';
COMMENT ON COLUMN presence_logs."networkState" IS 'Device network state at time of check. Helps distinguish GPS failures due to connectivity vs evasion.';

-- ============================================================
-- 3. FIELD WORK SESSIONS
--    State machine:
--      pending_approval -> cancelled    (member cancels before manager acts)
--      pending_approval -> approved     (manager approves)
--      pending_approval -> auto_approved (manager timeout)
--      approved -> active               (member departs)
--      auto_approved -> active          (member departs)
--      active -> completed              (member returns)
--      pending_approval -> rejected     (manager rejects -> grace period -> checkout)
-- ============================================================
CREATE TABLE IF NOT EXISTS field_work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "attendanceId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "nfcTagId" UUID,                                  -- The field work NFC tag used
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endedAt" TIMESTAMPTZ,                            -- When field work session ended administratively
  "returnTime" TIMESTAMPTZ,                         -- When member physically returned (distinct from endedAt)
  reason TEXT,                                       -- Optional reason for field work
  status TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval', 'approved', 'active', 'rejected', 'completed', 'auto_approved', 'cancelled')),
  "approvedBy" UUID,                                -- Manager who approved/rejected
  "approvedAt" TIMESTAMPTZ,
  "rejectionReason" TEXT,                           -- Why manager rejected
  "managerNotifiedAt" TIMESTAMPTZ,
  "locationSnapshots" JSONB DEFAULT '[]'::jsonb,    -- Array of {lat, lng, time, accuracy}
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_field_work_member ON field_work_sessions("userId", status);
CREATE INDEX IF NOT EXISTS idx_field_work_attendance ON field_work_sessions("attendanceId");
CREATE INDEX IF NOT EXISTS idx_field_work_pending ON field_work_sessions(status) WHERE status = 'pending_approval';

COMMENT ON TABLE field_work_sessions IS 'Tracks field work declarations when team members leave office for tasks. Requires manager approval.';
COMMENT ON COLUMN field_work_sessions."returnTime" IS 'When the member physically returned. Distinct from endedAt which is administrative close.';
COMMENT ON COLUMN field_work_sessions."locationSnapshots" IS 'JSONB array of periodic GPS captures during field work. Each element: {"lat": float, "lng": float, "accuracy": float|null, "timestamp": ISO8601 string, "batteryLevel": int|null}. Written every checkIntervalMinutes during active field work.';

-- ============================================================
-- 3b. MANAGER DEPUTIES (FCM fallback routing)
--     When a manager is unavailable (no FCM token, out of office),
--     field work approval requests route to their configured deputy.
-- ============================================================
CREATE TABLE IF NOT EXISTS manager_deputies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "managerId" UUID NOT NULL,               -- The primary manager
  "deputyId" UUID NOT NULL,                -- The fallback approver
  "organizationId" UUID,                   -- Scoped to org (optional)
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ,
  UNIQUE ("managerId", "deputyId")         -- No duplicate pairings
);

CREATE INDEX IF NOT EXISTS idx_manager_deputies_manager ON manager_deputies("managerId") WHERE "isActive" = true;

COMMENT ON TABLE manager_deputies IS 'Maps managers to their fallback deputies for field work approvals. Used when primary manager has no FCM token or is out of office.';

-- ============================================================
-- 4. ALTER attendance TABLE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'presenceStatus') THEN
    ALTER TABLE attendance ADD COLUMN "presenceStatus" TEXT DEFAULT 'verified';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'lastVerifiedAt') THEN
    ALTER TABLE attendance ADD COLUMN "lastVerifiedAt" TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'geofenceViolations') THEN
    ALTER TABLE attendance ADD COLUMN "geofenceViolations" INTEGER DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN attendance."presenceStatus" IS 'Current verification status: verified, field_work, absent, unverified';
COMMENT ON COLUMN attendance."lastVerifiedAt" IS 'Timestamp of last successful presence verification check';
COMMENT ON COLUMN attendance."geofenceViolations" IS 'Count of geofence violation incidents during this attendance session';

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE presence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own presence logs"
  ON presence_logs FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can read own presence logs"
  ON presence_logs FOR SELECT TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Managers can read all presence logs"
  ON presence_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')));

ALTER TABLE field_work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own field work sessions"
  ON field_work_sessions FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can read own field work sessions"
  ON field_work_sessions FOR SELECT TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Managers can read all field work sessions"
  ON field_work_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')));

CREATE POLICY "Managers can update field work sessions"
  ON field_work_sessions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')));

ALTER TABLE presence_verification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read verification settings"
  ON presence_verification_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage verification settings"
  ON presence_verification_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- manager_deputies RLS
ALTER TABLE manager_deputies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read their own deputies"
  ON manager_deputies FOR SELECT TO authenticated
  USING ("managerId" = auth.uid() OR "deputyId" = auth.uid());

CREATE POLICY "Admins can manage all deputies"
  ON manager_deputies FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
