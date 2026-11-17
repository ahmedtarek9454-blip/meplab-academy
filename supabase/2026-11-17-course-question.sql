-- MEP LAB: "are you one of our course students? which course?" on the profile + Google Classroom link per course
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

-- 2) where tasks are handed in: the course's Google Classroom (the Player's "submit task" button lands there via /go/task)
alter table public.courses add column if not exists classroom_url text check (classroom_url is null or classroom_url like 'https://classroom.google.com/%');
