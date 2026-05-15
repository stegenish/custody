create extension if not exists pgcrypto;

create table if not exists public.custody_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Custody calendar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custody_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'parent')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id),
  unique (group_id, email)
);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custody_groups(id) on delete cascade,
  token_hash text not null unique,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  used_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.calendar_versions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custody_groups(id) on delete cascade,
  version integer not null,
  schedule_data jsonb not null,
  accepted_proposal_id uuid,
  created_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id) on delete set null,
  unique (group_id, version)
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custody_groups(id) on delete cascade,
  status text not null check (
    status in ('draft', 'sent', 'withdrawn', 'rejected', 'countered', 'accepted')
  ),
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  current_author_user_id uuid not null references auth.users(id) on delete cascade,
  receiver_user_id uuid references auth.users(id) on delete set null,
  base_calendar_version integer not null,
  current_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_proposal_per_group
  on public.proposals (group_id)
  where status = 'sent';

create unique index if not exists one_draft_proposal_per_parent
  on public.proposals (group_id, current_author_user_id)
  where status = 'draft';

create table if not exists public.proposal_revisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  revision_number integer not null,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  base_calendar_version integer not null,
  schedule_data jsonb not null,
  created_at timestamptz not null default now(),
  unique (proposal_id, revision_number)
);

alter table public.proposals
  add constraint proposals_current_revision_fk
  foreign key (current_revision_id)
  references public.proposal_revisions(id)
  deferrable initially deferred;

create table if not exists public.proposal_comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.shared_date_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custody_groups(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.custody_groups enable row level security;
alter table public.parent_memberships enable row level security;
alter table public.group_invites enable row level security;
alter table public.calendar_versions enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_revisions enable row level security;
alter table public.proposal_comments enable row level security;
alter table public.shared_date_notes enable row level security;

create or replace function public.is_group_parent(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_memberships
    where group_id = target_group_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_memberships
    where group_id = target_group_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "parents can read their groups"
  on public.custody_groups for select
  using (public.is_group_parent(id));

create policy "parents can read memberships"
  on public.parent_memberships for select
  using (public.is_group_parent(group_id));

create policy "admins can manage invites"
  on public.group_invites for all
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

create policy "parents can read calendar versions"
  on public.calendar_versions for select
  using (public.is_group_parent(group_id));

create policy "parents can insert calendar versions"
  on public.calendar_versions for insert
  with check (public.is_group_parent(group_id));

create policy "parents can read proposals"
  on public.proposals for select
  using (public.is_group_parent(group_id));

create policy "parents can write proposals"
  on public.proposals for all
  using (public.is_group_parent(group_id))
  with check (public.is_group_parent(group_id));

create policy "parents can read proposal revisions"
  on public.proposal_revisions for select
  using (
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_revisions.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "parents can write proposal revisions"
  on public.proposal_revisions for all
  using (
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_revisions.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  )
  with check (
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_revisions.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "parents can read proposal comments"
  on public.proposal_comments for select
  using (
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_comments.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "comment authors can write comments"
  on public.proposal_comments for all
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create policy "parents can read shared notes"
  on public.shared_date_notes for select
  using (public.is_group_parent(group_id));

create policy "note authors can write shared notes"
  on public.shared_date_notes for all
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create or replace function public.ensure_initial_group()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  existing_group_id uuid;
  created_group_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if current_email <> 'thomas.stegen@gmail.com' then
    raise exception 'Only the initial parent can create the custody group';
  end if;

  select group_id
    into existing_group_id
  from public.parent_memberships
  where user_id = current_user_id
  limit 1;

  if existing_group_id is not null then
    return existing_group_id;
  end if;

  if exists (select 1 from public.custody_groups) then
    raise exception 'Custody group already exists';
  end if;

  insert into public.custody_groups (name)
  values ('Custody calendar')
  returning id into created_group_id;

  insert into public.parent_memberships (group_id, user_id, email, role)
  values (created_group_id, current_user_id, current_email, 'admin');

  insert into public.calendar_versions (
    group_id,
    version,
    schedule_data,
    created_by_user_id
  )
  values (
    created_group_id,
    1,
    '{"labels":[],"schedules":[],"overrides":[]}'::jsonb,
    current_user_id
  );

  return created_group_id;
end;
$$;

create or replace function public.get_my_group_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select group_id
  from public.parent_memberships
  where user_id = auth.uid()
  order by created_at
  limit 1;
$$;

create or replace function public.regenerate_group_invite(
  target_group_id uuid,
  invite_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  parent_count integer;
  created_invite_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_admin(target_group_id) then
    raise exception 'Only the group admin can manage invites';
  end if;

  select count(*)
    into parent_count
  from public.parent_memberships
  where group_id = target_group_id;

  if parent_count >= 2 then
    raise exception 'Custody group already has two parents';
  end if;

  update public.group_invites
  set revoked_at = now()
  where group_id = target_group_id
    and used_at is null
    and revoked_at is null;

  insert into public.group_invites (
    group_id,
    token_hash,
    created_by_user_id
  )
  values (
    target_group_id,
    invite_token_hash,
    current_user_id
  )
  returning id into created_invite_id;

  return created_invite_id;
end;
$$;

create or replace function public.join_group_with_invite(invite_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  matched_invite public.group_invites%rowtype;
  parent_count integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into matched_invite
  from public.group_invites
  where token_hash = invite_token_hash
    and used_at is null
    and revoked_at is null
  for update;

  if matched_invite.id is null then
    raise exception 'Invite is invalid or already used';
  end if;

  if exists (
    select 1
    from public.parent_memberships
    where group_id = matched_invite.group_id
      and user_id = current_user_id
  ) then
    return matched_invite.group_id;
  end if;

  select count(*)
    into parent_count
  from public.parent_memberships
  where group_id = matched_invite.group_id;

  if parent_count >= 2 then
    raise exception 'Custody group already has two parents';
  end if;

  insert into public.parent_memberships (
    group_id,
    user_id,
    email,
    role
  )
  values (
    matched_invite.group_id,
    current_user_id,
    current_email,
    'parent'
  );

  update public.group_invites
  set used_at = now(),
      used_by_user_id = current_user_id
  where id = matched_invite.id;

  return matched_invite.group_id;
end;
$$;

grant execute on function public.ensure_initial_group() to authenticated;
grant execute on function public.get_my_group_id() to authenticated;
grant execute on function public.regenerate_group_invite(uuid, text) to authenticated;
grant execute on function public.join_group_with_invite(text) to authenticated;
