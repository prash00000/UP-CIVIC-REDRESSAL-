-- Migration 001: Initial Schema for UP Civic Grievance Helper
-- Supabase / PostgreSQL compatible

create extension if not exists "pgcrypto";

create table if not exists districts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_hi text,
  lgd_code text unique,
  division text,
  created_at timestamptz not null default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  slug text not null,
  name_en text not null,
  name_hi text,
  lgd_code text unique,
  aliases text[] default '{}',
  created_at timestamptz not null default now(),
  unique (district_id, slug)
);

create table if not exists urban_bodies (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  kind text not null check (kind in ('nagar_nigam', 'nagar_palika', 'nagar_panchayat')),
  slug text not null,
  name_en text not null,
  name_hi text,
  lgd_code text,
  created_at timestamptz not null default now(),
  unique (district_id, slug)
);

create table if not exists tehsils (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  slug text not null,
  name_en text not null,
  name_hi text,
  samadhan_diwas_note text,
  created_at timestamptz not null default now(),
  unique (district_id, slug)
);

create table if not exists posts (
  code text primary key, -- bdo, cdo, dpro, dm, sdm, tehsildar, eo, commissioner, ee-pwd, ee-pmgsy
  name_en text not null,
  name_hi text not null,
  area_type text not null check (area_type in ('rural', 'town', 'city', 'district'))
);

create table if not exists offices (
  id uuid primary key default gen_random_uuid(),
  post_code text not null references posts(code),
  district_id uuid not null references districts(id) on delete cascade,
  block_id uuid references blocks(id) on delete cascade,
  urban_body_id uuid references urban_bodies(id) on delete cascade,
  tehsil_id uuid references tehsils(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (post_code, district_id, block_id, urban_body_id, tehsil_id, label)
);

create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by uuid,
  file_sha256 text not null,
  rows_total int not null default 0,
  rows_accepted int not null default 0,
  rows_rejected int not null default 0,
  notes text
);

create table if not exists contact_versions (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  cug_mobile text check (cug_mobile is null or cug_mobile ~ '^[6-9][0-9]{9}$'),
  office_phone text,
  email text,
  status text not null check (status in ('verified', 'single_source', 'conflicting', 'stale', 'missing')),
  flags text[] default '{}',
  checked_on date not null,
  is_current boolean not null default false,
  review_state text not null default 'pending' check (review_state in ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  import_batch_id uuid references import_batches(id),
  created_at timestamptz not null default now()
);

-- Ensure only one current version per office
create unique index if not exists one_current_per_office on contact_versions(office_id) where is_current;

create table if not exists contact_sources (
  id uuid primary key default gen_random_uuid(),
  contact_version_id uuid not null references contact_versions(id) on delete cascade,
  url text not null,
  source_type text not null,
  source_last_updated date,
  fetched_on date not null default current_date,
  role text not null check (role in ('primary', 'secondary'))
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  contact_version_id uuid references contact_versions(id) on delete set null,
  kind text not null check (kind in ('wrong_number', 'no_answer', 'transferred', 'wrong_email', 'other')),
  note text check (note is null or char_length(note) <= 300),
  reporter_hash text not null,
  created_at timestamptz not null default now(),
  state text not null default 'open' check (state in ('open', 'confirmed', 'dismissed'))
);

create table if not exists admin_profiles (
  user_id uuid primary key,
  role text not null check (role in ('reviewer', 'admin')),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz default now(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb
);

create table if not exists publish_runs (
  id uuid primary key default gen_random_uuid(),
  at timestamptz default now(),
  actor uuid,
  snapshot_version text not null,
  districts int not null default 0,
  contacts int not null default 0,
  status text not null default 'success'
);

-- Indexes for performance
create index if not exists idx_blocks_district on blocks(district_id);
create index if not exists idx_offices_district on offices(district_id);
create index if not exists idx_contact_versions_current on contact_versions(office_id, is_current);
create index if not exists idx_reports_office on reports(office_id, state);
create index if not exists idx_reports_hash_date on reports(reporter_hash, created_at);
