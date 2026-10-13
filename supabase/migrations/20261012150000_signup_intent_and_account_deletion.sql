alter table public.profiles
  add column if not exists signup_intent text not null default 'student'
  check (signup_intent in ('student', 'organization_manager', 'both'));

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_university text;
  requested_intent text;
begin
  profile_name := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  profile_university := new.raw_user_meta_data ->> 'university_id';
  requested_intent := new.raw_user_meta_data ->> 'signup_intent';

  if char_length(profile_name) < 2 or char_length(profile_name) > 80 then
    raise exception 'Invalid profile name';
  end if;

  if profile_university is distinct from 'oau' then
    raise exception 'Unsupported university';
  end if;

  if requested_intent not in ('student', 'organization_manager', 'both')
    or requested_intent is null then
    requested_intent := 'student';
  end if;

  insert into public.profiles (
    id,
    full_name,
    university_id,
    role,
    signup_intent
  )
  values (
    new.id,
    profile_name,
    profile_university,
    'student',
    requested_intent
  );

  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user()
  from public, anon, authenticated;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public, anon, authenticated;
grant all on public.account_deletion_requests to service_role;
