-- MEP LAB: course join codes + students added by Hamada (run once in Supabase → SQL Editor)

-- orders can now come from a join code or be added by the admin (no payment receipt)
alter table public.orders drop constraint if exists orders_method_check;
alter table public.orders add constraint orders_method_check check (method in ('instapay','vodafone_cash','code','manual'));

-- one active code per course; only the admin can see or change codes (students type it, the server checks it)
create table if not exists public.course_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{4,24}$'),
  course_id uuid not null references public.courses(id) on delete cascade,
  active boolean not null default true,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.course_codes enable row level security;
drop policy if exists "codes_admin_all" on public.course_codes;
create policy "codes_admin_all" on public.course_codes for all using (public.is_admin()) with check (public.is_admin());

-- the same student can't hold two approved seats in one course
create unique index if not exists orders_one_approved_per_course on public.orders(user_id, course_id) where status = 'approved';
