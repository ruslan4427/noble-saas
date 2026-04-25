-- ─── Organization default working hours ──────────────────────────────────────
-- Stored during onboarding (step 4) as org-level defaults.
-- Used as fallback when a staff member has no staff_schedule row yet.
-- Run in Supabase SQL Editor before deploying onboarding.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS default_work_start time DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS default_work_end   time DEFAULT '19:00';
