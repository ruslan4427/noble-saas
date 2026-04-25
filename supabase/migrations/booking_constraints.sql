-- ─── Booking integrity constraints ──────────────────────────────────────────
-- Run in Supabase SQL Editor (service role or postgres role).

-- 1. Add end_time and duration_min columns
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS end_time     timestamptz,
  ADD COLUMN IF NOT EXISTS duration_min integer;

-- 2. Backfill: assume 30-min slots for any existing rows without an end_time.
--    Guard on start_time IS NOT NULL so we never backfill a NULL end_time.
UPDATE bookings
SET
  end_time     = start_time + interval '30 minutes',
  duration_min = 30
WHERE end_time IS NULL
  AND start_time IS NOT NULL;

-- Rows with NULL start_time are broken data — set a sentinel so NOT NULL passes.
UPDATE bookings
SET
  start_time   = created_at,
  end_time     = created_at + interval '30 minutes',
  duration_min = 30
WHERE start_time IS NULL;

-- 3. Lock them down as NOT NULL with a safe default
ALTER TABLE bookings
  ALTER COLUMN end_time     SET NOT NULL,
  ALTER COLUMN duration_min SET NOT NULL,
  ALTER COLUMN duration_min SET DEFAULT 30;

-- 4. Sanity check: slot must end after it starts
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_end_after_start;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_end_after_start
  CHECK (end_time > start_time);

-- 5. Range-overlap exclusion — no two active bookings for the same staff may
--    overlap in wall-clock time.  btree_gist is required for mixed-type EXCLUDE.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_no_staff_overlap;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_staff_overlap
  EXCLUDE USING GIST (
    master_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status IN ('confirmed', 'pending'));

-- 6. Supporting index for fast overlap queries (used by the validation layer)
CREATE INDEX IF NOT EXISTS idx_bookings_master_timerange
  ON bookings USING GIST (master_id, tstzrange(start_time, end_time, '[)'));
