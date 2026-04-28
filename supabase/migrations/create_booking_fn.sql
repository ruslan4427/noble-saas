-- ─── Atomic booking creation with race-condition protection ──────────────────
-- Run in Supabase SQL Editor.
-- Requires: btree_gist extension + bookings_no_staff_overlap constraint
-- (both added by booking_constraints.sql).

CREATE OR REPLACE FUNCTION create_booking(
  p_org_id        uuid,
  p_master_id     uuid,
  p_date          date,
  p_time_slot     text,
  p_slot_start    timestamptz,
  p_slot_end      timestamptz,
  p_client_name   text,
  p_client_phone  text,
  p_client_email  text  DEFAULT NULL,
  p_service_name  text  DEFAULT '',
  p_price_cents   int   DEFAULT 0,
  p_duration_min  int   DEFAULT 30
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id  uuid;
  v_reminder_at timestamptz;
BEGIN
  -- ── 1. Staff slot overlap (advisory lock prevents concurrent inserts) ───────
  --    Lock the (master_id, time range) combination so two concurrent requests
  --    for the same slot cannot both pass the check before either inserts.
  PERFORM pg_advisory_xact_lock(
    hashtext(p_master_id::text || p_slot_start::text)
  );

  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE master_id = p_master_id
      AND status IN ('confirmed', 'pending')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(p_slot_start, p_slot_end, '[)')
  ) THEN
    RAISE EXCEPTION 'SLOT_OCCUPIED'
      USING HINT = 'This time slot is already booked for the selected staff member.';
  END IF;

  -- ── 2. Client double-booking (same phone, overlapping time) ──────────────
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE client_phone = p_client_phone
      AND status IN ('confirmed', 'pending')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(p_slot_start, p_slot_end, '[)')
  ) THEN
    RAISE EXCEPTION 'CLIENT_OVERLAP'
      USING HINT = 'This client already has a booking that overlaps the requested time.';
  END IF;

  -- ── 3. Insert ─────────────────────────────────────────────────────────────
  v_reminder_at := p_slot_start - interval '2 hours';

  INSERT INTO bookings (
    org_id, master_id, date, time_slot,
    client_name, client_phone, client_email,
    service_name, price_cents, duration_min,
    start_time, end_time,
    status, reminder_at, reminder_sent
  ) VALUES (
    p_org_id, p_master_id, p_date, p_time_slot,
    p_client_name, p_client_phone, p_client_email,
    p_service_name, p_price_cents, p_duration_min,
    p_slot_start, p_slot_end,
    'confirmed', v_reminder_at, false
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;

EXCEPTION
  -- Re-raise our own named exceptions unchanged
  WHEN OTHERS THEN
    IF SQLERRM IN ('SLOT_OCCUPIED', 'CLIENT_OVERLAP') THEN
      RAISE;
    END IF;
    -- Exclusion constraint violation (concurrent insert won the race)
    IF SQLSTATE = '23P01' THEN
      RAISE EXCEPTION 'SLOT_OCCUPIED'
        USING HINT = 'Concurrent booking conflict. Please try another slot.';
    END IF;
    RAISE;
END;
$$;

-- Allow authenticated users and service role to call this function
GRANT EXECUTE ON FUNCTION create_booking TO authenticated, service_role;
