-- MEP LAB: "are you one of our course students? which course?" on the profile + task files up to 50 MB
-- Run once in Supabase → SQL Editor (safe to run again).

-- 1) the answer the member gives on the profile page
alter table public.profiles add column if not exists course_answer text check (course_answer in ('yes','no'));
alter table public.profiles add column if not exists claimed_course_id uuid references public.courses(id) on delete set null;
-- pending  = said yes, waiting for Hamada
-- approved = Hamada confirmed (or the member joined with the course code)
-- rejected = Hamada said no
alter table public.profiles add column if not exists claim_status text check (claim_status in ('pending','approved','rejected'));
alter table public.profiles add column if not exists claimed_at timestamptz;
create index if not exists profiles_claim_pending_idx on public.profiles(claim_status) where claim_status = 'pending';

-- 2) task files: 50 MB per file on the bucket itself, and a student may delete his own old file when he resubmits
update storage.buckets set file_size_limit = 52428800 where id = 'tasks';
drop policy if exists "tasks_delete_own" on storage.objects;
create policy "tasks_delete_own" on storage.objects
  for delete using (bucket_id = 'tasks' and (storage.foldername(name))[1] = auth.uid()::text);
