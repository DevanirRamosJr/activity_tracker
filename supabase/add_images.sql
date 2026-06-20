-- ============================================
-- Image support: column on entries + storage bucket
-- Run this once in the Supabase SQL Editor.
-- ============================================

-- 1. Store the chosen/uploaded image URL on each entry.
alter table entries add column if not exists image_url text;

-- 2. Public bucket to hold manually-uploaded images.
insert into storage.buckets (id, name, public)
values ('entry-images', 'entry-images', true)
on conflict (id) do nothing;

-- 3. Allow anyone to read images (the bucket is public anyway, but be explicit).
drop policy if exists "entry-images read" on storage.objects;
create policy "entry-images read"
  on storage.objects for select
  using (bucket_id = 'entry-images');

-- 4. Allow uploads with the publishable (anon) key.
drop policy if exists "entry-images insert" on storage.objects;
create policy "entry-images insert"
  on storage.objects for insert
  with check (bucket_id = 'entry-images');
