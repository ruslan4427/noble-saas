-- Fix: cancelled bookings should not block rebooking the same slot.
-- Replace unconditional unique constraint with a partial unique index
-- that only applies to active (non-cancelled) bookings.

-- Drop any existing unconditional unique constraint/index on (master_id, date, time_slot)
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_master_id_date_time_slot_key;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_pkey_slot;

DROP INDEX IF EXISTS bookings_master_id_date_time_slot_key;
DROP INDEX IF EXISTS bookings_master_date_slot_key;
DROP INDEX IF EXISTS idx_bookings_unique_slot;

-- Partial unique index: only active bookings occupy the slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_active_slot
  ON bookings (master_id, date, time_slot)
  WHERE status != 'cancelled';
