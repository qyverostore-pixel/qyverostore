create table public.messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Anyone can insert messages"
on public.messages
for insert
to anon, authenticated
with check (true);

create policy "Admins can select messages"
on public.messages
for select
to authenticated
using (public.is_admin());

create policy "Admins can update messages"
on public.messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete messages"
on public.messages
for delete
to authenticated
using (public.is_admin());
