-- staff_schedule table
-- Зберігає робочі години, перерви та відпустку для кожного майстра
-- Виконати в Supabase SQL Editor

create table if not exists staff_schedule (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null references staff(id) on delete cascade,
  org_id        uuid not null references organizations(id) on delete cascade,

  -- day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  day_of_week   smallint not null check (day_of_week between 0 and 6),

  is_day_off    boolean not null default false,

  -- working hours e.g. '09:00', '18:00'
  work_start    time,
  work_end      time,

  -- break time e.g. '13:00', '14:00' (nullable = no break)
  break_start   time,
  break_end     time,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (staff_id, day_of_week)
);

-- vacation_blocks table
-- Блокує конкретний діапазон дат для майстра
create table if not exists vacation_blocks (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  date_from   date not null,
  date_to     date not null,
  note        text,
  created_at  timestamptz not null default now(),
  check (date_to >= date_from)
);

-- RLS
alter table staff_schedule enable row level security;
alter table vacation_blocks enable row level security;

create policy "org owner manages schedule"
  on staff_schedule for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

create policy "org owner manages vacations"
  on vacation_blocks for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

create policy "public reads schedule"
  on staff_schedule for select using (true);

create policy "public reads vacations"
  on vacation_blocks for select using (true);

create index if not exists idx_staff_schedule_staff_id on staff_schedule(staff_id);
create index if not exists idx_vacation_blocks_staff_date on vacation_blocks(staff_id, date_from, date_to);
