-- STORAGE SETUP: Run these in Supabase Dashboard -> Storage

-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "syllabuses"
-- 3. Create a new bucket called "class-notes"
-- 4. For each bucket, set it as "Public" bucket

-- Then run these SQL commands in SQL Editor to set up storage policies:

-- Policies for syllabuses bucket
create policy "Users can upload their own syllabuses"
on storage.objects for insert
with check (
  bucket_id = 'syllabuses'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own syllabuses"
on storage.objects for select
using (
  bucket_id = 'syllabuses'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own syllabuses"
on storage.objects for update
using (
  bucket_id = 'syllabuses'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own syllabuses"
on storage.objects for delete
using (
  bucket_id = 'syllabuses'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for class-notes bucket
create policy "Users can upload their own class notes"
on storage.objects for insert
with check (
  bucket_id = 'class-notes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own class notes"
on storage.objects for select
using (
  bucket_id = 'class-notes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own class notes"
on storage.objects for update
using (
  bucket_id = 'class-notes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own class notes"
on storage.objects for delete
using (
  bucket_id = 'class-notes'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to files (optional - for viewing uploaded files)
create policy "Public can view syllabuses"
on storage.objects for select
using (bucket_id = 'syllabuses');

create policy "Public can view class notes"
on storage.objects for select
using (bucket_id = 'class-notes');

