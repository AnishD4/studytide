-- EXTRACURRICULARS: Run this in Supabase SQL Editor
-- Creates tables for tracking activities, hours, achievements, and goals

-- Extracurricular Activities table
create table if not exists public.extracurriculars (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text default 'club',
  description text,
  organization text,
  role text,
  color text default '#6366f1',
  icon text default 'star',
  start_date date,
  end_date date,
  is_active boolean default true,
  is_leadership boolean default false,
  website_url text,
  contact_email text,
  meeting_schedule text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activity Hours Log table
create table if not exists public.activity_hours (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  extracurricular_id uuid references public.extracurriculars(id) on delete cascade not null,
  date date not null default current_date,
  hours numeric not null,
  minutes integer default 0,
  activity_type text default 'meeting',
  description text,
  location text,
  verified boolean default false,
  verified_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Achievements table
create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  extracurricular_id uuid references public.extracurriculars(id) on delete cascade,
  title text not null,
  description text,
  achievement_type text default 'award',
  date_earned date default current_date,
  issuing_organization text,
  level text,
  certificate_url text,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activity Goals table
create table if not exists public.activity_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  extracurricular_id uuid references public.extracurriculars(id) on delete cascade,
  title text not null,
  description text,
  target_hours numeric,
  target_date date,
  status text default 'in_progress',
  priority text default 'medium',
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Upcoming Events table
create table if not exists public.activity_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  extracurricular_id uuid references public.extracurriculars(id) on delete cascade not null,
  title text not null,
  description text,
  event_type text default 'meeting',
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  location text,
  is_mandatory boolean default false,
  reminder_set boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.extracurriculars enable row level security;
alter table public.activity_hours enable row level security;
alter table public.achievements enable row level security;
alter table public.activity_goals enable row level security;
alter table public.activity_events enable row level security;

-- RLS Policies for extracurriculars
create policy "Users can view own extracurriculars" on public.extracurriculars
  for select using (auth.uid() = user_id);
create policy "Users can insert own extracurriculars" on public.extracurriculars
  for insert with check (auth.uid() = user_id);
create policy "Users can update own extracurriculars" on public.extracurriculars
  for update using (auth.uid() = user_id);
create policy "Users can delete own extracurriculars" on public.extracurriculars
  for delete using (auth.uid() = user_id);

-- RLS Policies for activity_hours
create policy "Users can view own activity hours" on public.activity_hours
  for select using (auth.uid() = user_id);
create policy "Users can insert own activity hours" on public.activity_hours
  for insert with check (auth.uid() = user_id);
create policy "Users can update own activity hours" on public.activity_hours
  for update using (auth.uid() = user_id);
create policy "Users can delete own activity hours" on public.activity_hours
  for delete using (auth.uid() = user_id);

-- RLS Policies for achievements
create policy "Users can view own achievements" on public.achievements
  for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on public.achievements
  for insert with check (auth.uid() = user_id);
create policy "Users can update own achievements" on public.achievements
  for update using (auth.uid() = user_id);
create policy "Users can delete own achievements" on public.achievements
  for delete using (auth.uid() = user_id);

-- RLS Policies for activity_goals
create policy "Users can view own activity goals" on public.activity_goals
  for select using (auth.uid() = user_id);
create policy "Users can insert own activity goals" on public.activity_goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own activity goals" on public.activity_goals
  for update using (auth.uid() = user_id);
create policy "Users can delete own activity goals" on public.activity_goals
  for delete using (auth.uid() = user_id);

-- RLS Policies for activity_events
create policy "Users can view own activity events" on public.activity_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own activity events" on public.activity_events
  for insert with check (auth.uid() = user_id);
create policy "Users can update own activity events" on public.activity_events
  for update using (auth.uid() = user_id);
create policy "Users can delete own activity events" on public.activity_events
  for delete using (auth.uid() = user_id);

