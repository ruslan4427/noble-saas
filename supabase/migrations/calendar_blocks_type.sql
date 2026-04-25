-- Add block type: 'time' for partial blocks, 'full_day' to block an entire day
ALTER TABLE calendar_blocks
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'time'
  CHECK (type IN ('time', 'full_day'));
