create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  university_id text not null check (university_id = 'oau'),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  university_id text not null check (university_id = 'oau'),
  organization_id text not null,
  role text not null default 'member' check (role in ('member', 'manager')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index if not exists organization_memberships_active_manager_idx
  on public.organization_memberships (user_id, status)
  where role = 'manager' and status = 'active';

alter table public.organization_memberships enable row level security;
revoke all on public.organization_memberships from anon, authenticated;
grant select on public.organization_memberships to authenticated;

create policy "Users can read their own organization memberships"
  on public.organization_memberships for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_university text;
begin
  profile_name := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  profile_university := new.raw_user_meta_data ->> 'university_id';

  if char_length(profile_name) < 2 or char_length(profile_name) > 80 then
    raise exception 'Invalid profile name';
  end if;

  if profile_university is distinct from 'oau' then
    raise exception 'Unsupported university';
  end if;

  insert into public.profiles (id, full_name, university_id, role)
  values (new.id, profile_name, profile_university, 'student');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
