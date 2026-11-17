-- country of study on every profile (run once)
alter table public.profiles add column if not exists country text;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, department, university, grad_year, country)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'phone',
          nullif(new.raw_user_meta_data->>'department', ''),
          nullif(new.raw_user_meta_data->>'university', ''),
          nullif(new.raw_user_meta_data->>'grad_year', '')::integer,
          nullif(new.raw_user_meta_data->>'country', ''))
  on conflict (id) do nothing;
  return new;
end $$;
