-- calendar_blocks table
-- Blocks time on the calendar — prevents bookings and shows visually
-- Run in Supabase SQL Editor

create table if not exists calendar_blocks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  staff_id    uuid references staff(id) on delete cascade, -- null = blocks all staff
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  reason      text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_time > start_time)
);

alter table calendar_blocks enable row level security;

-- Owner can manage blocks
create policy "org owner manages blocks"
  on calendar_blocks for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Public can read (for booking page availability check)
create policy "public reads blocks"
  on calendar_blocks for select
  using (true);

create index if not exists idx_calendar_blocks_org_time on calendar_blocks(org_id, start_time, end_time);
create index if not exists idx_calendar_blocks_staff on calendar_blocks(staff_id);
