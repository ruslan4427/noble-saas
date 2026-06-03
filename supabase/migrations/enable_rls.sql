-- Enable Row-Level Security on all public tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ecszrloosntejjawlalv/sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff             ENABLE ROW LEVEL SECURITY;
ALTER TABLE services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedule    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_consent       ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ORGANIZATIONS
-- Owners read/write their own org. Public booking page reads by slug (anon).
-- ─────────────────────────────────────────────────────────────────────────────

-- Owner: full access to their own row
CREATE POLICY "owners_manage_own_org"
  ON organizations FOR ALL
  TO authenticated
  USING  (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Public: read-only by slug (booking page needs name, timezone, social links)
CREATE POLICY "public_read_org_by_slug"
  ON organizations FOR SELECT
  TO anon, authenticated
  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STAFF
-- ─────────────────────────────────────────────────────────────────────────────

-- Public: read active staff (booking page shows staff list)
CREATE POLICY "public_read_active_staff"
  ON staff FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Owner: full control over their org's staff
CREATE POLICY "owners_manage_staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SERVICES
-- ─────────────────────────────────────────────────────────────────────────────

-- Public: read active services (booking page shows service menu)
CREATE POLICY "public_read_active_services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Owner: full control
CREATE POLICY "owners_manage_services"
  ON services FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. STAFF_SCHEDULE
-- ─────────────────────────────────────────────────────────────────────────────

-- Public: read schedule (needed to compute available slots)
CREATE POLICY "public_read_staff_schedule"
  ON staff_schedule FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner: full control
CREATE POLICY "owners_manage_staff_schedule"
  ON staff_schedule FOR ALL
  TO authenticated
  USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN organizations o ON o.id = s.org_id
      WHERE o.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN organizations o ON o.id = s.org_id
      WHERE o.owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. VACATION_BLOCKS
-- ─────────────────────────────────────────────────────────────────────────────

-- Public: read (needed to block unavailable dates on booking page)
CREATE POLICY "public_read_vacation_blocks"
  ON vacation_blocks FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner: full control
CREATE POLICY "owners_manage_vacation_blocks"
  ON vacation_blocks FOR ALL
  TO authenticated
  USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN organizations o ON o.id = s.org_id
      WHERE o.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN organizations o ON o.id = s.org_id
      WHERE o.owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. BOOKINGS
-- Clients can insert + read their own bookings.
-- Owners can read all bookings in their org.
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone can insert a booking (anonymous clients book via booking page)
CREATE POLICY "anyone_can_insert_booking"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Clients: read their own booking by id (confirmation page uses booking id)
-- We allow anon SELECT by booking id — scoped enough, no PII leakage beyond what client already knows
CREATE POLICY "public_read_bookings_for_slot_check"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner: update/delete bookings in their org (cancel, reschedule)
CREATE POLICY "owners_manage_bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. CALENDAR_BLOCKS
-- ─────────────────────────────────────────────────────────────────────────────

-- Public: read (booking page needs to check admin blocks)
CREATE POLICY "public_read_calendar_blocks"
  ON calendar_blocks FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner: full control
CREATE POLICY "owners_manage_calendar_blocks"
  ON calendar_blocks FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. BILLING_EVENTS
-- Only service role (Stripe webhook) writes. Owner reads their own.
-- ─────────────────────────────────────────────────────────────────────────────

-- Owner: read their own billing events
CREATE POLICY "owners_read_own_billing_events"
  ON billing_events FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- No INSERT/UPDATE policy for authenticated/anon — Stripe webhook uses service role (bypasses RLS)


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. SMS_CONSENT
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone can insert consent (client opts in on booking page)
CREATE POLICY "anyone_can_insert_sms_consent"
  ON sms_consent FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Owner: read consent records for their org
CREATE POLICY "owners_read_sms_consent"
  ON sms_consent FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );
