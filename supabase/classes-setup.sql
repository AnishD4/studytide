-- CLASSES & GRADES: Run this in Supabase SQL Editor
-- Adds classes, notes, syllabuses, and grades tables

-- Classes table
create table if not exists public.classes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  teacher text,
  room text,
  color text default '#6366f1',
  icon text default 'book',
  schedule jsonb default '[]'::jsonb,
  credits numeric default 3.0,
  current_grade numeric,
  target_grade numeric default 90,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Class Notes table
create table if not exists public.class_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  title text not null,
  content text,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Syllabuses table
create table if not exists public.syllabuses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null unique,
  file_url text not null,
  file_name text not null,
  file_type text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Grades table
create table if not exists public.grades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  name text not null,
  category text default 'assignment',
  score numeric not null,
  max_score numeric default 100,
  weight numeric default 1.0,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Grade Categories table (for weighted grading)
create table if not exists public.grade_categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  name text not null,
  weight numeric default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, name)
);

-- Enable RLS on all new tables
alter table public.classes enable row level security;
alter table public.class_notes enable row level security;
alter table public.syllabuses enable row level security;
alter table public.grades enable row level security;
alter table public.grade_categories enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own classes" on public.classes;
drop policy if exists "Users can insert own classes" on public.classes;
drop policy if exists "Users can update own classes" on public.classes;
drop policy if exists "Users can delete own classes" on public.classes;

drop policy if exists "Users can view own notes" on public.class_notes;
drop policy if exists "Users can insert own notes" on public.class_notes;
drop policy if exists "Users can update own notes" on public.class_notes;
drop policy if exists "Users can delete own notes" on public.class_notes;

drop policy if exists "Users can view own syllabuses" on public.syllabuses;
drop policy if exists "Users can insert own syllabuses" on public.syllabuses;
drop policy if exists "Users can update own syllabuses" on public.syllabuses;
drop policy if exists "Users can delete own syllabuses" on public.syllabuses;

drop policy if exists "Users can view own grades" on public.grades;
drop policy if exists "Users can insert own grades" on public.grades;
drop policy if exists "Users can update own grades" on public.grades;
drop policy if exists "Users can delete own grades" on public.grades;

drop policy if exists "Users can view own grade categories" on public.grade_categories;
drop policy if exists "Users can insert own grade categories" on public.grade_categories;
drop policy if exists "Users can update own grade categories" on public.grade_categories;
drop policy if exists "Users can delete own grade categories" on public.grade_categories;

-- Classes policies
create policy "Users can view own classes" on public.classes
  for select using (auth.uid() = user_id);
create policy "Users can insert own classes" on public.classes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own classes" on public.classes
  for update using (auth.uid() = user_id);
create policy "Users can delete own classes" on public.classes
  for delete using (auth.uid() = user_id);

-- Class notes policies
create policy "Users can view own notes" on public.class_notes
  for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.class_notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.class_notes
  for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.class_notes
  for delete using (auth.uid() = user_id);

-- Syllabuses policies
create policy "Users can view own syllabuses" on public.syllabuses
  for select using (auth.uid() = user_id);
create policy "Users can insert own syllabuses" on public.syllabuses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own syllabuses" on public.syllabuses
  for update using (auth.uid() = user_id);
create policy "Users can delete own syllabuses" on public.syllabuses
  for delete using (auth.uid() = user_id);

-- Grades policies
create policy "Users can view own grades" on public.grades
  for select using (auth.uid() = user_id);
create policy "Users can insert own grades" on public.grades
  for insert with check (auth.uid() = user_id);
create policy "Users can update own grades" on public.grades
  for update using (auth.uid() = user_id);
create policy "Users can delete own grades" on public.grades
  for delete using (auth.uid() = user_id);

-- Grade categories policies
create policy "Users can view own grade categories" on public.grade_categories
  for select using (auth.uid() = user_id);
create policy "Users can insert own grade categories" on public.grade_categories
  for insert with check (auth.uid() = user_id);
create policy "Users can update own grade categories" on public.grade_categories
  for update using (auth.uid() = user_id);
create policy "Users can delete own grade categories" on public.grade_categories
  for delete using (auth.uid() = user_id);

-- Function to update class current_grade when grades change
create or replace function update_class_grade()
returns trigger as $$
declare
  new_grade numeric;
begin
  -- Calculate weighted average grade for the class
  select
    case
      when sum(max_score * weight) > 0
      then (sum(score * weight) / sum(max_score * weight)) * 100
      else null
    end
  into new_grade
  from public.grades
  where class_id = coalesce(new.class_id, old.class_id);

  -- Update the class current_grade
  update public.classes
  set current_grade = new_grade, updated_at = now()
  where id = coalesce(new.class_id, old.class_id);

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Triggers for auto-updating class grade
drop trigger if exists on_grade_change on public.grades;
create trigger on_grade_change
  after insert or update or delete on public.grades
  for each row execute procedure update_class_grade();

