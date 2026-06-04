-- =============================================================
-- Kosco Seeds — Full Schema Migration v1
-- Run this on your Supabase project via the SQL editor
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- USERS (extends auth.users)
-- -------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null check (role in ('super_admin','admin','manager','inspector','viewer')) default 'viewer',
  zone_area text,
  is_active boolean not null default true,
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "Users can read own row" on public.users for select using (auth.uid() = id);
create policy "Admins can read all users" on public.users for select using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);
create policy "Admins can manage users" on public.users for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin'))
);

-- -------------------------------------------------------
-- COMPANIES
-- -------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  address text,
  gst_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.companies enable row level security;
create policy "Authenticated users can read companies" on public.companies for select to authenticated using (true);

insert into public.companies (name, address) values ('Kosco Seeds', 'Rajasthan, India');

-- -------------------------------------------------------
-- CROP VARIETIES
-- -------------------------------------------------------
create table public.crop_varieties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  crop_name text not null,
  variety_code text not null,
  variety_name text,
  crop_season text check (crop_season in ('kharif','rabi','zaid')),
  min_inspection_interval_days int default 30,
  second_inspection_gap_days int default 21,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.crop_varieties enable row level security;
create policy "Authenticated users can read crop varieties" on public.crop_varieties for select to authenticated using (true);
create policy "Admins can manage crop varieties" on public.crop_varieties for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin'))
);

insert into public.crop_varieties (crop_name, variety_code, variety_name, crop_season) values
  ('Paddy', 'PS1509', 'Pusa Sugandh 1509', 'kharif'),
  ('Paddy', 'PS121', 'Pusa Sugandh 121', 'kharif'),
  ('Wheat', 'HI8498', 'HI 8498', 'rabi'),
  ('Wheat', 'GW322', 'GW 322', 'rabi'),
  ('Mustard', 'RH749', 'RH 749', 'rabi'),
  ('Bajra', 'HHB67', 'HHB 67 Improved', 'kharif');

-- -------------------------------------------------------
-- SEED QUALITIES
-- -------------------------------------------------------
create table public.seed_qualities (
  id uuid primary key default gen_random_uuid(),
  quality_name text not null,
  quality_code text,
  description text,
  sort_order int default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seed_qualities enable row level security;
create policy "Authenticated users can read seed qualities" on public.seed_qualities for select to authenticated using (true);

insert into public.seed_qualities (quality_name, quality_code, sort_order) values
  ('Foundation', 'FND', 1),
  ('Certified', 'CRT', 2),
  ('Truthful Label (PDL)', 'PDL', 3),
  ('Breeder', 'BRD', 4);

-- -------------------------------------------------------
-- FARMERS
-- -------------------------------------------------------
create table public.farmers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  farmer_code text unique,
  full_name text not null,
  father_or_husband_name text,
  gender text,
  date_of_birth date,
  primary_phone text not null,
  alternate_phone text,
  whatsapp_number text,
  email text,
  profile_photo_url text,
  -- Address
  village text,
  tehsil text,
  district text,
  state text default 'Rajasthan',
  pin_code text,
  -- IDs (sensitive)
  aadhar_number text,   -- store last 4 digits only
  pan_number text,
  bank_account_number text,
  bank_ifsc text,
  bank_name text,
  -- Classification
  tags jsonb default '[]'::jsonb,
  agreement_status text default 'active',
  notes text,
  -- Agreement
  has_production_agreement boolean default true,
  agreement_start_date date,
  agreement_end_date date,
  agreement_document_url text,
  -- Soft delete
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.farmers enable row level security;
create policy "Authenticated users can read farmers" on public.farmers for select to authenticated using (not is_deleted);
create policy "Admins and managers can manage farmers" on public.farmers for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);
create policy "Inspectors can read assigned farmers" on public.farmers for select using (
  exists (
    select 1 from public.inspection_assignments ia
    join public.production_agreements pa on pa.id = ia.production_agreement_id
    where pa.farmer_id = farmers.id and ia.assigned_inspector_id = auth.uid()
  )
);

-- -------------------------------------------------------
-- FARMER FIELDS
-- -------------------------------------------------------
create table public.farmer_fields (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers(id) on delete cascade,
  field_name text,
  khasra_number text,
  khata_number text,
  patwari_halka text,
  village text,
  tehsil text,
  district text,
  state text default 'Rajasthan',
  total_area_acres numeric(8,3),
  area_under_seed_acres numeric(8,3),
  boundary_geojson jsonb,
  centroid_lat numeric(10,7),
  centroid_lng numeric(10,7),
  soil_type text,
  irrigation_source text,
  irrigation_availability text,
  govt_registration_number text,
  agency_registration_date date,
  agency_registration_status text default 'pending',
  is_primary_field boolean default false,
  is_verified boolean default false,
  notes text,
  is_deleted boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.farmer_fields enable row level security;
create policy "Authenticated users can read fields" on public.farmer_fields for select to authenticated using (not is_deleted);
create policy "Admins and managers can manage fields" on public.farmer_fields for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);

-- -------------------------------------------------------
-- PRODUCTION AGREEMENTS
-- -------------------------------------------------------
create table public.production_agreements (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers(id),
  field_id uuid references public.farmer_fields(id),
  crop_variety_id uuid references public.crop_varieties(id),
  seed_quality_id uuid references public.seed_qualities(id),
  crop_season text check (crop_season in ('kharif','rabi','zaid')),
  crop_year int,
  agreement_number text unique,
  sowing_date date,
  expected_harvest_date date,
  area_acres numeric(8,3),
  seed_quantity_kg numeric(10,3),
  expected_yield_quintals numeric(10,3),
  actual_yield_quintals numeric(10,3),
  status text not null default 'active' check (status in ('draft','active','inspected','harvested','closed','cancelled')),
  tags jsonb default '[]'::jsonb,
  notes text,
  assigned_manager_id uuid references public.users(id),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.production_agreements enable row level security;
create policy "Authenticated users can read agreements" on public.production_agreements for select to authenticated using (true);
create policy "Admins and managers can manage agreements" on public.production_agreements for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);

-- -------------------------------------------------------
-- INSPECTION ASSIGNMENTS
-- -------------------------------------------------------
create table public.inspection_assignments (
  id uuid primary key default gen_random_uuid(),
  production_agreement_id uuid not null references public.production_agreements(id),
  inspection_number int not null,
  inspection_type text not null default 'standard' check (inspection_type in ('standard_1','standard_2','additional')),
  assigned_inspector_id uuid not null references public.users(id),
  assigned_by uuid references public.users(id),
  scheduled_date date,
  status text not null default 'pending' check (status in ('pending','in-progress','completed','cancelled')),
  notes_for_inspector text,
  additional_reason text,  -- required when inspection_type = 'additional'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.inspection_assignments enable row level security;
create policy "Inspectors can read own assignments" on public.inspection_assignments for select using (
  assigned_inspector_id = auth.uid() or
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);
create policy "Managers can manage assignments" on public.inspection_assignments for all using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);
create policy "Inspectors can update their own assignments" on public.inspection_assignments for update using (
  assigned_inspector_id = auth.uid()
);

-- -------------------------------------------------------
-- INSPECTIONS
-- -------------------------------------------------------
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.inspection_assignments(id),
  production_agreement_id uuid not null references public.production_agreements(id),
  inspector_id uuid not null references public.users(id),
  inspection_number int,
  inspection_date date not null,
  inspection_time time,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  gps_accuracy_meters numeric(6,2),
  gps_captured_at timestamptz,
  crop_stage text,
  plant_stand text,
  plant_population_per_sqm int,
  weed_infestation text,
  pest_disease_status text,
  pest_disease_details text,
  isolation_distance_met boolean,
  isolation_distance_meters numeric(6,2),
  off_type_plants_count int default 0,
  off_type_percentage numeric(5,2) default 0,
  estimated_yield_quintals numeric(10,3),
  yield_estimate_basis text,
  overall_status text check (overall_status in ('pass','conditional-pass','fail')),
  rejection_reason text,
  recommendation text,
  field_observations text,
  action_required text,
  follow_up_required boolean default false,
  follow_up_notes text,
  is_synced boolean default true,
  local_draft_id text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.inspections enable row level security;
create policy "Inspectors can manage own inspections" on public.inspections for all using (
  inspector_id = auth.uid() or
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
);

-- -------------------------------------------------------
-- INSPECTION PHOTOS
-- -------------------------------------------------------
create table public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  photo_url text not null,
  thumbnail_url text,
  caption text,
  photo_type text check (photo_type in ('field-overview','crop-closeup','isolation','pest','document','other')),
  taken_at timestamptz,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  sort_order int default 0,
  is_synced boolean default true,
  local_blob_id text,
  created_at timestamptz not null default now()
);
alter table public.inspection_photos enable row level security;
create policy "Users can read inspection photos" on public.inspection_photos for select to authenticated using (true);
create policy "Inspectors can insert photos" on public.inspection_photos for insert with check (
  exists (
    select 1 from public.inspections i
    where i.id = inspection_id and (
      i.inspector_id = auth.uid() or
      exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin','manager'))
    )
  )
);

-- -------------------------------------------------------
-- AUDIT LOG
-- -------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "Admins can read audit log" on public.audit_log for select using (
  exists (select 1 from public.users where id = auth.uid() and role in ('super_admin','admin'))
);
create policy "System can insert audit logs" on public.audit_log for insert with check (true);

-- -------------------------------------------------------
-- INDEXES for performance
-- -------------------------------------------------------
create index idx_farmers_phone on public.farmers(primary_phone);
create index idx_farmers_village on public.farmers(village);
create index idx_farmers_district on public.farmers(district);
create index idx_farmers_code on public.farmers(farmer_code);
create index idx_fields_farmer on public.farmer_fields(farmer_id);
create index idx_agreements_farmer on public.production_agreements(farmer_id);
create index idx_assignments_inspector on public.inspection_assignments(assigned_inspector_id);
create index idx_assignments_status on public.inspection_assignments(status);
create index idx_inspections_agreement on public.inspections(production_agreement_id);
create index idx_audit_log_user on public.audit_log(user_id);
create index idx_audit_log_entity on public.audit_log(entity_type, entity_id);

-- -------------------------------------------------------
-- Updated_at trigger function
-- -------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.users for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.farmers for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.farmer_fields for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.production_agreements for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.inspection_assignments for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.inspections for each row execute function public.handle_updated_at();

-- -------------------------------------------------------
-- Auto-create user profile on signup
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'viewer'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
