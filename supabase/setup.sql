-- Run this in the Supabase SQL Editor after creating the project.
-- Create the owner's Auth user in Supabase first, then run the owner INSERT
-- at the bottom with that exact email address.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.portfolio_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on private.portfolio_owners from anon, authenticated;

create or replace function private.is_portfolio_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.portfolio_owners
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_portfolio_owner() from public;
grant execute on function private.is_portfolio_owner() to anon, authenticated;

create or replace function public.is_portfolio_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_portfolio_owner();
$$;

revoke all on function public.is_portfolio_owner() from public;
grant execute on function public.is_portfolio_owner() to authenticated;

create table if not exists public.portfolio_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (
    category in (
      'about', 'education', 'skill', 'project', 'hackathon',
      'achievement', 'certificate', 'team', 'contact'
    )
  ),
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 1200),
  details text not null default '' check (length(details) <= 4000),
  is_public boolean not null default true,
  file_path text,
  file_bucket text check (
    file_bucket is null or file_bucket in ('portfolio-public', 'portfolio-private')
  ),
  file_name text,
  file_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint file_location_complete check (
    (file_path is null and file_bucket is null)
    or (file_path is not null and file_bucket is not null)
  )
);

create index if not exists portfolio_records_public_category_idx
  on public.portfolio_records (category, created_at)
  where is_public = true;

alter table public.portfolio_records enable row level security;

drop policy if exists "Public records are readable by everyone"
  on public.portfolio_records;
create policy "Public records are readable by everyone"
  on public.portfolio_records for select
  to anon, authenticated
  using (is_public or (select private.is_portfolio_owner()));

drop policy if exists "Only the portfolio owner can create records"
  on public.portfolio_records;
create policy "Only the portfolio owner can create records"
  on public.portfolio_records for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select private.is_portfolio_owner())
  );

drop policy if exists "Only the portfolio owner can update records"
  on public.portfolio_records;
create policy "Only the portfolio owner can update records"
  on public.portfolio_records for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_portfolio_owner())
  )
  with check (
    owner_id = (select auth.uid())
    and (select private.is_portfolio_owner())
  );

drop policy if exists "Only the portfolio owner can delete records"
  on public.portfolio_records;
create policy "Only the portfolio owner can delete records"
  on public.portfolio_records for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    and (select private.is_portfolio_owner())
  );

grant select on public.portfolio_records to anon, authenticated;
grant insert, update, delete on public.portfolio_records to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'portfolio-public',
    'portfolio-public',
    true,
    20971520,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'portfolio-private',
    'portfolio-private',
    false,
    20971520,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public portfolio files are readable by everyone"
  on storage.objects;
create policy "Public portfolio files are readable by everyone"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio-public');

drop policy if exists "Owner can upload portfolio files"
  on storage.objects;
create policy "Owner can upload portfolio files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('portfolio-public', 'portfolio-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_portfolio_owner())
  );

drop policy if exists "Owner can read private portfolio files"
  on storage.objects;
create policy "Owner can read private portfolio files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'portfolio-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_portfolio_owner())
  );

drop policy if exists "Owner can delete portfolio files"
  on storage.objects;
create policy "Owner can delete portfolio files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('portfolio-public', 'portfolio-private')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.is_portfolio_owner())
  );

-- Replace the email below with the exact email used for the owner Auth user.
insert into private.portfolio_owners (user_id)
select id
from auth.users
where email = 'REPLACE_WITH_OWNER_EMAIL'
on conflict (user_id) do nothing;

insert into public.portfolio_records (
  owner_id, category, title, description, details, is_public
)
select
  owner.user_id,
  initial.category,
  initial.title,
  initial.description,
  initial.details,
  true
from private.portfolio_owners as owner
cross join (
  values
    ('about', 'About Dinesh M.', 'Student at SRM Vadapalani in Chennai.', ''),
    ('education', 'SRM Vadapalani', 'Chennai', ''),
    ('hackathon', 'SRM Vadapalani Gameathon', '5th place · Score: 60.83', ''),
    ('achievement', '5th place — SRM Vadapalani Gameathon', 'Score: 60.83', ''),
    ('team', 'SRM Vadapalani Gameathon',
      'Team leader / backend developer: Pravin Raj. Team member: Theeban.',
      '')
) as initial(category, title, description, details)
where not exists (
  select 1
  from public.portfolio_records as existing
  where existing.owner_id = owner.user_id
    and existing.category = initial.category
    and existing.title = initial.title
);

update public.portfolio_records as record
set description = 'Student at SRM Vadapalani in Chennai.'
from private.portfolio_owners as owner
where record.owner_id = owner.user_id
  and record.category = 'about'
  and record.title = 'About Dinesh M.'
  and record.description = 'Add a short introduction in Manage Portfolio.';

update public.portfolio_records as record
set details = ''
from private.portfolio_owners as owner
where record.owner_id = owner.user_id
  and record.category = 'education'
  and record.title = 'SRM Vadapalani'
  and record.details = 'Add your course and study dates in Manage Portfolio.';

update public.portfolio_records as record
set details = ''
from private.portfolio_owners as owner
where record.owner_id = owner.user_id
  and record.category = 'team'
  and record.title = 'SRM Vadapalani Gameathon'
  and record.details = 'Your role in the team: add details in Manage Portfolio.';
