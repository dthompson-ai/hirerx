-- Run this in your Supabase SQL editor

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  agency_name text,
  standard_benefits text default '',
  subscription_status text default 'inactive', -- 'active', 'inactive', 'gifted', 'canceled'
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Job ads table
create table public.job_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Untitled Job Ad',
  status text default 'intake', -- 'intake', 'reviewing', 'complete'

  -- Raw input
  raw_job_description text default '',

  -- Monetary opportunity
  pay_rate text default '',
  temp_to_perm boolean default false,
  temp_to_perm_details text default '',
  overtime_opportunity text default '',
  bonus_details text default '',
  weekly_pay boolean default true,

  -- Shift opportunity
  shift_raw text default '',
  shift_translation text default '',

  -- Healthcare-specific purpose
  facility_type text default '',
  patient_population text[] default '{}',
  specialty text[] default '{}',
  purpose_other text default '',

  -- Benefits (overrides account default for this job)
  benefits_override text default '',

  -- AI-extracted elements for review step (array of objects)
  extracted_elements jsonb default '[]',

  -- Final assembled output
  final_output text default '',

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.job_ads enable row level security;

create policy "Users can view own job ads"
  on public.job_ads for select
  using (auth.uid() = user_id);

create policy "Users can insert own job ads"
  on public.job_ads for insert
  with check (auth.uid() = user_id);

create policy "Users can update own job ads"
  on public.job_ads for update
  using (auth.uid() = user_id);

create policy "Users can delete own job ads"
  on public.job_ads for delete
  using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_job_ads_updated_at
  before update on public.job_ads
  for each row execute procedure public.handle_updated_at();
