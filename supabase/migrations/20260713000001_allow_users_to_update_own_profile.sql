create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.restrict_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.id
    and not public.is_admin()
    and (
      new.id is distinct from old.id
      or new.avatar_url is distinct from old.avatar_url
      or new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.created_at is distinct from old.created_at
      or new.last_login is distinct from old.last_login
    ) then
    raise exception 'Users may only update their name and phone number';
  end if;

  return new;
end;
$$;

drop trigger if exists restrict_profile_self_update on public.profiles;
create trigger restrict_profile_self_update
  before update on public.profiles
  for each row execute procedure public.restrict_profile_self_update();
