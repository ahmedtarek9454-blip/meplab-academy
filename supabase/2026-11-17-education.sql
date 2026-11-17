-- MEP LAB: department, university and graduation year on every profile (run once in Supabase → SQL Editor)
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists grad_year integer check (grad_year between 1970 and 2035);

-- new accounts keep what they typed at sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, department, university, grad_year)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'phone',
          nullif(new.raw_user_meta_data->>'department', ''),
          nullif(new.raw_user_meta_data->>'university', ''),
          nullif(new.raw_user_meta_data->>'grad_year', '')::integer)
  on conflict (id) do nothing;
  return new;
end $$;
