alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_login timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role, is_active)
  values (
    new.id,
    nullif(trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')), ''),
    new.raw_user_meta_data ->> 'phone',
    'customer',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, full_name, phone, role, is_active)
select
  id,
  nullif(trim(concat_ws(' ', raw_user_meta_data ->> 'first_name', raw_user_meta_data ->> 'last_name')), ''),
  raw_user_meta_data ->> 'phone',
  'customer',
  true
from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select role = 'admin' and is_active = true
      from public.profiles
      where id = (select auth.uid())
    ),
    false
  );
$$;
