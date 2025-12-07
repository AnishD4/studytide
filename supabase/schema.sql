-- Supabase SQL Schema for StudyTide
-- Run this in your Supabase Dashboard -> SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Settings table
create table public.user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,

  -- School schedule
  school_days text[] default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  school_start_time time default '08:00',
  school_end_time time default '15:00',

  -- Study preferences
  preferred_study_start_time time default '16:00',
  preferred_study_end_time time default '21:00',
  max_study_hours_per_day integer default 4,
  break_duration_minutes integer default 15,
  study_session_duration_minutes integer default 45,

  -- Notification preferences
  notifications_enabled boolean default true,
  reminder_before_due_hours integer default 24,
  daily_summary_enabled boolean default true,
  daily_summary_time time default '07:00',

  -- Display preferences
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  week_starts_on text default 'sunday' check (week_starts_on in ('sunday', 'monday')),

  -- GPA settings
  gpa_scale numeric default 4.0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Classes table
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  teacher text,
  room text,
  color text default '#6366f1',
  schedule jsonb, -- e.g., [{"day": "monday", "start": "09:00", "end": "10:00"}]
  credits numeric default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Assignments table
create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  description text,
  type text default 'assignment' check (type in ('assignment', 'test', 'quiz', 'project', 'homework', 'other')),
  due_date timestamp with time zone,
  difficulty integer default 3 check (difficulty >= 1 and difficulty <= 5),
  estimated_minutes integer default 60,
  priority integer default 3 check (priority >= 1 and priority <= 5),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  completed_at timestamp with time zone,
  grade numeric,
  max_grade numeric default 100,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Grades table
create table public.grades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  assignment_id uuid references public.assignments(id) on delete set null,
  name text not null,
  category text default 'assignment' check (category in ('assignment', 'test', 'quiz', 'project', 'homework', 'participation', 'other')),
  score numeric not null,
  max_score numeric default 100,
  weight numeric default 1.0,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study Plans table
create table public.study_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  tasks jsonb not null, -- Array of study tasks with times
  ai_generated boolean default false,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.grades enable row level security;
alter table public.study_plans enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies for user_settings
create policy "Users can view own settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own settings" on public.user_settings
  for update using (auth.uid() = user_id);

-- RLS Policies for classes
create policy "Users can view own classes" on public.classes
  for select using (auth.uid() = user_id);

create policy "Users can insert own classes" on public.classes
  for insert with check (auth.uid() = user_id);

create policy "Users can update own classes" on public.classes
  for update using (auth.uid() = user_id);

create policy "Users can delete own classes" on public.classes
  for delete using (auth.uid() = user_id);

-- RLS Policies for assignments
create policy "Users can view own assignments" on public.assignments
  for select using (auth.uid() = user_id);

create policy "Users can insert own assignments" on public.assignments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own assignments" on public.assignments
  for update using (auth.uid() = user_id);

create policy "Users can delete own assignments" on public.assignments
  for delete using (auth.uid() = user_id);

-- RLS Policies for grades
create policy "Users can view own grades" on public.grades
  for select using (auth.uid() = user_id);

create policy "Users can insert own grades" on public.grades
  for insert with check (auth.uid() = user_id);

create policy "Users can update own grades" on public.grades
  for update using (auth.uid() = user_id);

create policy "Users can delete own grades" on public.grades
  for delete using (auth.uid() = user_id);

-- RLS Policies for study_plans
create policy "Users can view own study plans" on public.study_plans
  for select using (auth.uid() = user_id);

create policy "Users can insert own study plans" on public.study_plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update own study plans" on public.study_plans
  for update using (auth.uid() = user_id);

create policy "Users can delete own study plans" on public.study_plans
  for delete using (auth.uid() = user_id);

-- Function to create profile and settings on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Create default settings
  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile and settings on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to all tables
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_user_settings_updated_at before update on public.user_settings
  for each row execute procedure public.update_updated_at_column();

create trigger update_classes_updated_at before update on public.classes
  for each row execute procedure public.update_updated_at_column();

create trigger update_assignments_updated_at before update on public.assignments
  for each row execute procedure public.update_updated_at_column();

create trigger update_study_plans_updated_at before update on public.study_plans
  for each row execute procedure public.update_updated_at_column();

