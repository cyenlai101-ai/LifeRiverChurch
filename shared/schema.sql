create extension if not exists "uuid-ossp";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('Admin', 'CenterStaff', 'BranchStaff', 'Leader', 'Member');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_type') then
    create type public.member_type as enum ('Member', 'Seeker');
  end if;
end $$;

create table if not exists public.sites (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  name text not null,
  theme_color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  password_hash text not null,
  full_name text,
  phone text,
  role user_role default 'Member'::user_role not null,
  member_type member_type default 'Member'::member_type not null,
  site_id uuid references public.sites(id),
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.users
  add column if not exists is_active boolean default true not null;

alter table if exists public.users
  add column if not exists phone text;

alter table if exists public.users
  add column if not exists member_type member_type default 'Member'::member_type not null;

alter table if exists public.events
  add column if not exists poster_url text;

create table if not exists public.dashboard_summaries (
  user_id uuid primary key references public.users(id),
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('Draft', 'Published', 'Closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type public.registration_status as enum ('Pending', 'Confirmed', 'Waitlisted', 'Cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'prayer_privacy') then
    create type public.prayer_privacy as enum ('Private', 'Group', 'Public');
  end if;
  if not exists (select 1 from pg_type where typname = 'prayer_status') then
    create type public.prayer_status as enum ('Pending', 'Approved', 'Archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'care_subject_type') then
    create type public.care_subject_type as enum ('Member', 'Seeker', 'Family', 'Community');
  end if;
  if not exists (select 1 from pg_type where typname = 'care_subject_status') then
    create type public.care_subject_status as enum ('Active', 'Paused', 'Closed');
  end if;
end $$;

create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  site_id uuid references public.sites(id),
  title text not null,
  description text,
  poster_url text,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone,
  capacity integer,
  waitlist_enabled boolean default false not null,
  status event_status default 'Draft'::event_status not null,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.event_registrations (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid not null references public.events(id),
  user_id uuid references public.users(id),
  status registration_status default 'Pending'::registration_status not null,
  ticket_count integer default 1 not null,
  is_proxy boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.prayer_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  site_id uuid references public.sites(id),
  content text not null,
  privacy_level prayer_privacy default 'Group'::prayer_privacy not null,
  status prayer_status default 'Pending'::prayer_status not null,
  amen_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.care_subjects (
  id uuid default uuid_generate_v4() primary key,
  site_id uuid references public.sites(id),
  name text not null,
  subject_type care_subject_type default 'Member'::care_subject_type not null,
  status care_subject_status default 'Active'::care_subject_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.care_logs (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid not null references public.care_subjects(id),
  created_by uuid references public.users(id),
  note text not null,
  mood_score integer,
  spiritual_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
