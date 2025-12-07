-- PROGRESS & HABITS: Run this in Supabase SQL Editor
-- Creates tables for streaks, habits, reflections, and notifications

-- Study Sessions table (for tracking daily study time)
create table if not exists public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete set null,
  date date not null default current_date,
  duration_minutes integer not null,
  session_type text default 'study', -- study, review, practice, homework
  focus_score integer check (focus_score >= 1 and focus_score <= 5), -- 1-5 self-rating
  notes text,
  topics_covered text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Habits table (customizable habits to track)
create table if not exists public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  icon text default '📚',
  color text default '#6366f1',
  target_frequency text default 'daily', -- daily, weekdays, weekly
  target_count integer default 1, -- how many times per frequency
  reminder_time time,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habit Completions table (log when habits are done)
create table if not exists public.habit_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null default current_date,
  notes text,
  unique(habit_id, date) -- one completion per habit per day
);

-- Streaks table (track various streak types)
create table if not exists public.streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  streak_type text not null, -- study, habit, login, assignment_early
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  streak_start_date date,
  total_days integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, streak_type)
);

-- Assignment Reflections table (post-assignment/test reflections)
create table if not exists public.reflections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  grade_id uuid references public.grades(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  reflection_type text default 'assignment', -- assignment, test, quiz, project, weekly, monthly
  title text not null,
  date date not null default current_date,
  -- Performance reflection
  expected_score numeric,
  actual_score numeric,
  what_went_well text,
  what_to_improve text,
  -- Study habits reflection
  study_hours_spent numeric,
  study_method text, -- flashcards, notes, practice, group, video
  started_studying_days_before integer,
  -- Emotional reflection
  confidence_before integer check (confidence_before >= 1 and confidence_before <= 5),
  confidence_after integer check (confidence_after >= 1 and confidence_after <= 5),
  stress_level integer check (stress_level >= 1 and stress_level <= 5),
  -- Action items
  action_items text[],
  lessons_learned text,
  -- Meta
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Procrastination Tracker table
create table if not exists public.procrastination_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete set null,
  assignment_name text,
  due_date date,
  date_started date,
  days_before_due integer,
  was_on_time boolean,
  procrastination_reason text, -- forgot, overwhelmed, unclear, unmotivated, distracted
  outcome text, -- completed_early, completed_on_time, late, incomplete
  quality_rating integer check (quality_rating >= 1 and quality_rating <= 5),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goals table (personal academic goals)
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  goal_type text default 'grade', -- grade, study_hours, streak, habit, gpa, custom
  target_value numeric,
  current_value numeric default 0,
  unit text, -- %, hours, days, points
  class_id uuid references public.classes(id) on delete set null,
  deadline date,
  status text default 'in_progress', -- in_progress, completed, failed, paused
  priority text default 'medium', -- low, medium, high
  milestones jsonb default '[]', -- [{title, target, completed}]
  reward text, -- self-reward for completing
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications/Reminders table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  notification_type text not null, -- reflection_reminder, procrastination_warning, streak_reminder, goal_deadline, habit_reminder
  title text not null,
  message text,
  link text, -- URL to navigate to
  related_id uuid, -- ID of related entity (grade, class, habit, etc.)
  related_type text, -- grades, classes, habits, goals
  priority text default 'normal', -- low, normal, high, urgent
  is_read boolean default false,
  is_dismissed boolean default false,
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weekly Progress Summary table (auto-generated weekly summaries)
create table if not exists public.weekly_summaries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  -- Study metrics
  total_study_minutes integer default 0,
  study_sessions_count integer default 0,
  avg_focus_score numeric,
  -- Habits metrics
  habits_completed integer default 0,
  habits_total integer default 0,
  habit_completion_rate numeric,
  -- Academic metrics
  assignments_completed integer default 0,
  assignments_on_time integer default 0,
  avg_grade numeric,
  -- Streaks
  study_streak integer default 0,
  longest_streak_this_week integer default 0,
  -- Reflections
  reflections_completed integer default 0,
  -- Goals
  goals_progress jsonb default '[]',
  -- AI insights (placeholder for future)
  insights text[],
  recommendations text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, week_start)
);

-- Daily Check-ins table (quick daily mood/productivity check)
create table if not exists public.daily_checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  mood integer check (mood >= 1 and mood <= 5), -- 1=awful, 5=great
  energy_level integer check (energy_level >= 1 and energy_level <= 5),
  productivity_rating integer check (productivity_rating >= 1 and productivity_rating <= 5),
  sleep_hours numeric,
  main_focus text, -- what's the main focus for today
  blockers text[], -- what might prevent productivity
  wins text[], -- what went well yesterday
  gratitude text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable RLS on all tables
alter table public.study_sessions enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.streaks enable row level security;
alter table public.reflections enable row level security;
alter table public.procrastination_logs enable row level security;
alter table public.goals enable row level security;
alter table public.notifications enable row level security;
alter table public.weekly_summaries enable row level security;
alter table public.daily_checkins enable row level security;

-- RLS Policies for study_sessions
create policy "Users can view own study sessions" on public.study_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own study sessions" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own study sessions" on public.study_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own study sessions" on public.study_sessions for delete using (auth.uid() = user_id);

-- RLS Policies for habits
create policy "Users can view own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

-- RLS Policies for habit_completions
create policy "Users can view own habit completions" on public.habit_completions for select using (auth.uid() = user_id);
create policy "Users can insert own habit completions" on public.habit_completions for insert with check (auth.uid() = user_id);
create policy "Users can update own habit completions" on public.habit_completions for update using (auth.uid() = user_id);
create policy "Users can delete own habit completions" on public.habit_completions for delete using (auth.uid() = user_id);

-- RLS Policies for streaks
create policy "Users can view own streaks" on public.streaks for select using (auth.uid() = user_id);
create policy "Users can insert own streaks" on public.streaks for insert with check (auth.uid() = user_id);
create policy "Users can update own streaks" on public.streaks for update using (auth.uid() = user_id);
create policy "Users can delete own streaks" on public.streaks for delete using (auth.uid() = user_id);

-- RLS Policies for reflections
create policy "Users can view own reflections" on public.reflections for select using (auth.uid() = user_id);
create policy "Users can insert own reflections" on public.reflections for insert with check (auth.uid() = user_id);
create policy "Users can update own reflections" on public.reflections for update using (auth.uid() = user_id);
create policy "Users can delete own reflections" on public.reflections for delete using (auth.uid() = user_id);

-- RLS Policies for procrastination_logs
create policy "Users can view own procrastination logs" on public.procrastination_logs for select using (auth.uid() = user_id);
create policy "Users can insert own procrastination logs" on public.procrastination_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own procrastination logs" on public.procrastination_logs for update using (auth.uid() = user_id);
create policy "Users can delete own procrastination logs" on public.procrastination_logs for delete using (auth.uid() = user_id);

-- RLS Policies for goals
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

-- RLS Policies for notifications
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert own notifications" on public.notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Users can delete own notifications" on public.notifications for delete using (auth.uid() = user_id);

-- RLS Policies for weekly_summaries
create policy "Users can view own weekly summaries" on public.weekly_summaries for select using (auth.uid() = user_id);
create policy "Users can insert own weekly summaries" on public.weekly_summaries for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly summaries" on public.weekly_summaries for update using (auth.uid() = user_id);
create policy "Users can delete own weekly summaries" on public.weekly_summaries for delete using (auth.uid() = user_id);

-- RLS Policies for daily_checkins
create policy "Users can view own daily checkins" on public.daily_checkins for select using (auth.uid() = user_id);
create policy "Users can insert own daily checkins" on public.daily_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own daily checkins" on public.daily_checkins for update using (auth.uid() = user_id);
create policy "Users can delete own daily checkins" on public.daily_checkins for delete using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists idx_study_sessions_user_date on public.study_sessions(user_id, date);
create index if not exists idx_habit_completions_user_date on public.habit_completions(user_id, date);
create index if not exists idx_reflections_user_date on public.reflections(user_id, date);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);
create index if not exists idx_goals_user_status on public.goals(user_id, status);
create index if not exists idx_daily_checkins_user_date on public.daily_checkins(user_id, date);

