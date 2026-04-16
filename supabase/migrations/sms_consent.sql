-- sms_consent table
-- Зберігає opt-in/opt-out статус для кожного номера телефону
-- Виконати в Supabase SQL Editor

create table if not exists sms_consent (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  phone       text not null,
  name        text,
  consented   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, phone)
);

alter table sms_consent enable row level security;

-- Owner can read their consents
create policy "org owner reads sms consent"
  on sms_consent for select
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Service role (API) can do everything
create policy "service role manages sms consent"
  on sms_consent for all
  using (true)
  with check (true);

create index if not exists idx_sms_consent_phone on sms_consent(phone);
create index if not exists idx_sms_consent_org_phone on sms_consent(org_id, phone);
