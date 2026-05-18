create extension if not exists pgcrypto;

create or replace function public.is_allowed_schedule_data_size(schedule_data jsonb)
returns boolean
language sql
immutable
as $$
  select char_length(schedule_data::text) <= 65536
$$;

create or replace function public.is_allowed_text_body_size(body text)
returns boolean
language sql
immutable
as $$
  select char_length(body) <= 4096
$$;

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
  schedule_data jsonb not null check (public.is_allowed_schedule_data_size(schedule_data)),
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
  schedule_data jsonb not null check (public.is_allowed_schedule_data_size(schedule_data)),
  created_at timestamptz not null default now(),
  unique (proposal_id, revision_number)
);

create table if not exists public.proposal_status_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  status text not null check (
    status in ('draft', 'sent', 'withdrawn', 'rejected', 'countered', 'accepted')
  ),
  actor_user_id uuid references auth.users(id) on delete set null,
  revision_id uuid references public.proposal_revisions(id) on delete set null,
  created_at timestamptz not null default now()
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
  body text not null check (public.is_allowed_text_body_size(body)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.shared_date_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.custody_groups(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  body text not null check (public.is_allowed_text_body_size(body)),
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
alter table public.proposal_status_events enable row level security;
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

create policy "parents can read proposals"
  on public.proposals for select
  using (public.is_group_parent(group_id));

create policy "parents can create their own draft proposals"
  on public.proposals for insert
  with check (
    public.is_group_parent(group_id)
    and status = 'draft'
    and created_by_user_id = auth.uid()
    and current_author_user_id = auth.uid()
    and receiver_user_id is null
  );

create policy "parents can update their own draft proposals"
  on public.proposals for update
  using (
    public.is_group_parent(group_id)
    and status = 'draft'
    and current_author_user_id = auth.uid()
  )
  with check (
    public.is_group_parent(group_id)
    and status = 'draft'
    and current_author_user_id = auth.uid()
  );

create policy "parents can read proposal revisions"
  on public.proposal_revisions for select
  using (
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_revisions.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "parents can read proposal status events"
  on public.proposal_status_events for select
  using (
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_status_events.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "current authors can create proposal revisions"
  on public.proposal_revisions for insert
  with check (
    author_user_id = auth.uid()
    and
    exists (
      select 1 from public.proposals
      where proposals.id = proposal_revisions.proposal_id
        and public.is_group_parent(proposals.group_id)
        and proposals.current_author_user_id = auth.uid()
        and proposals.status = 'draft'
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

create policy "parents can create proposal comments"
  on public.proposal_comments for insert
  with check (
    author_user_id = auth.uid()
    and deleted_at is null
    and exists (
      select 1 from public.proposals
      where proposals.id = proposal_comments.proposal_id
        and proposals.status in ('draft', 'sent')
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "comment authors can update active comments"
  on public.proposal_comments for update
  using (
    author_user_id = auth.uid()
    and deleted_at is null
    and exists (
      select 1 from public.proposals
      where proposals.id = proposal_comments.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  )
  with check (
    author_user_id = auth.uid()
    and exists (
      select 1 from public.proposals
      where proposals.id = proposal_comments.proposal_id
        and public.is_group_parent(proposals.group_id)
    )
  );

create policy "parents can read shared notes"
  on public.shared_date_notes for select
  using (public.is_group_parent(group_id));

create policy "parents can create shared notes"
  on public.shared_date_notes for insert
  with check (
    author_user_id = auth.uid()
    and deleted_at is null
    and public.is_group_parent(group_id)
  );

create policy "note authors can update active shared notes"
  on public.shared_date_notes for update
  using (
    author_user_id = auth.uid()
    and deleted_at is null
    and public.is_group_parent(group_id)
  )
  with check (
    author_user_id = auth.uid()
    and public.is_group_parent(group_id)
  );

create or replace function public.ensure_initial_group()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  initial_parent_email text := lower(coalesce(
    nullif(current_setting('app.initial_parent_email', true), ''),
    'thomas.stegen@gmail.com'
  ));
  existing_group_id uuid;
  created_group_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if current_email <> initial_parent_email then
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

create or replace function public.create_draft_proposal(target_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  latest_calendar public.calendar_versions%rowtype;
  created_proposal_id uuid;
  created_revision_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  if exists (
    select 1
    from public.proposals
    where group_id = target_group_id
      and status = 'draft'
      and current_author_user_id = current_user_id
  ) then
    raise exception 'Parent already has a draft proposal';
  end if;

  select *
    into latest_calendar
  from public.calendar_versions
  where group_id = target_group_id
  order by version desc
  limit 1;

  if latest_calendar.id is null then
    raise exception 'No agreed calendar found';
  end if;

  insert into public.proposals (
    group_id,
    status,
    created_by_user_id,
    current_author_user_id,
    base_calendar_version
  )
  values (
    target_group_id,
    'draft',
    current_user_id,
    current_user_id,
    latest_calendar.version
  )
  returning id into created_proposal_id;

  insert into public.proposal_revisions (
    proposal_id,
    revision_number,
    author_user_id,
    base_calendar_version,
    schedule_data
  )
  values (
    created_proposal_id,
    1,
    current_user_id,
    latest_calendar.version,
    latest_calendar.schedule_data
  )
  returning id into created_revision_id;

  update public.proposals
  set current_revision_id = created_revision_id,
      updated_at = now()
  where id = created_proposal_id;

  return created_proposal_id;
end;
$$;

create or replace function public.save_draft_proposal(
  target_group_id uuid,
  proposed_schedule_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  draft_proposal public.proposals%rowtype;
  next_revision_number integer;
  created_revision_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into draft_proposal
  from public.proposals
  where group_id = target_group_id
    and status = 'draft'
    and current_author_user_id = current_user_id
  limit 1;

  if draft_proposal.id is null then
    raise exception 'Draft proposal not found';
  end if;

  if not public.is_allowed_schedule_data_size(proposed_schedule_data) then
    raise exception 'Schedule data is too large';
  end if;

  select coalesce(max(revision_number), 0) + 1
    into next_revision_number
  from public.proposal_revisions
  where proposal_id = draft_proposal.id;

  insert into public.proposal_revisions (
    proposal_id,
    revision_number,
    author_user_id,
    base_calendar_version,
    schedule_data
  )
  values (
    draft_proposal.id,
    next_revision_number,
    current_user_id,
    draft_proposal.base_calendar_version,
    proposed_schedule_data
  )
  returning id into created_revision_id;

  update public.proposals
  set current_revision_id = created_revision_id,
      updated_at = now()
  where id = draft_proposal.id;

  return created_revision_id;
end;
$$;

create or replace function public.send_draft_proposal(
  target_group_id uuid,
  proposed_schedule_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  draft_proposal public.proposals%rowtype;
  receiver_id uuid;
  next_revision_number integer;
  created_revision_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  if exists (
    select 1
    from public.proposals
    where group_id = target_group_id
      and status = 'sent'
  ) then
    raise exception 'There is already an active proposal';
  end if;

  select user_id
    into receiver_id
  from public.parent_memberships
  where group_id = target_group_id
    and user_id <> current_user_id
  order by created_at
  limit 1;

  if receiver_id is null then
    raise exception 'No other parent found';
  end if;

  select *
    into draft_proposal
  from public.proposals
  where group_id = target_group_id
    and status = 'draft'
    and current_author_user_id = current_user_id
  limit 1;

  if draft_proposal.id is null then
    raise exception 'Draft proposal not found';
  end if;

  if not public.is_allowed_schedule_data_size(proposed_schedule_data) then
    raise exception 'Schedule data is too large';
  end if;

  select coalesce(max(revision_number), 0) + 1
    into next_revision_number
  from public.proposal_revisions
  where proposal_id = draft_proposal.id;

  insert into public.proposal_revisions (
    proposal_id,
    revision_number,
    author_user_id,
    base_calendar_version,
    schedule_data
  )
  values (
    draft_proposal.id,
    next_revision_number,
    current_user_id,
    draft_proposal.base_calendar_version,
    proposed_schedule_data
  )
  returning id into created_revision_id;

  update public.proposals
  set status = 'sent',
      receiver_user_id = receiver_id,
      current_revision_id = created_revision_id,
      updated_at = now()
  where id = draft_proposal.id;

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    draft_proposal.id,
    'sent',
    current_user_id,
    created_revision_id
  );

  return draft_proposal.id;
end;
$$;

create or replace function public.reset_draft_proposal(
  target_group_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  draft_proposal public.proposals%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into draft_proposal
  from public.proposals
  where group_id = target_group_id
    and status = 'draft'
    and current_author_user_id = current_user_id
  limit 1;

  if draft_proposal.id is null then
    raise exception 'Draft proposal not found';
  end if;

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    draft_proposal.id,
    'withdrawn',
    current_user_id,
    draft_proposal.current_revision_id
  );

  update public.proposals
  set status = 'withdrawn',
      receiver_user_id = null,
      updated_at = now()
  where id = draft_proposal.id;

  return draft_proposal.id;
end;
$$;

create or replace function public.withdraw_active_proposal(
  target_group_id uuid,
  target_proposal_id uuid,
  viewed_revision_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_proposal public.proposals%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into active_proposal
  from public.proposals
  where id = target_proposal_id
    and group_id = target_group_id
    and status = 'sent'
  limit 1;

  if active_proposal.id is null then
    raise exception 'No active proposal to withdraw';
  end if;

  if active_proposal.current_author_user_id <> current_user_id then
    raise exception 'Only the current sender can withdraw this proposal';
  end if;

  if active_proposal.current_revision_id <> viewed_revision_id then
    raise exception 'Proposal changed since it was viewed';
  end if;

  if exists (
    select 1
    from public.proposals
    where group_id = target_group_id
      and status = 'draft'
      and current_author_user_id = current_user_id
      and id <> target_proposal_id
  ) then
    raise exception 'Parent already has a draft proposal';
  end if;

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    active_proposal.id,
    'withdrawn',
    current_user_id,
    viewed_revision_id
  );

  update public.proposals
  set status = 'draft',
      receiver_user_id = null,
      updated_at = now()
  where id = active_proposal.id;

  return active_proposal.id;
end;
$$;

create or replace function public.discard_active_proposal(
  target_group_id uuid,
  target_proposal_id uuid,
  viewed_revision_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_proposal public.proposals%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into active_proposal
  from public.proposals
  where id = target_proposal_id
    and group_id = target_group_id
    and status = 'sent'
  limit 1;

  if active_proposal.id is null then
    raise exception 'No active proposal to discard';
  end if;

  if active_proposal.current_author_user_id <> current_user_id then
    raise exception 'Only the current sender can discard this proposal';
  end if;

  if active_proposal.current_revision_id <> viewed_revision_id then
    raise exception 'Proposal changed since it was viewed';
  end if;

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    active_proposal.id,
    'withdrawn',
    current_user_id,
    viewed_revision_id
  );

  update public.proposals
  set status = 'withdrawn',
      updated_at = now()
  where id = active_proposal.id;

  return active_proposal.id;
end;
$$;

create or replace function public.reject_active_proposal(
  target_group_id uuid,
  target_proposal_id uuid,
  viewed_revision_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_proposal public.proposals%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into active_proposal
  from public.proposals
  where id = target_proposal_id
    and group_id = target_group_id
    and status = 'sent'
  limit 1;

  if active_proposal.id is null then
    raise exception 'No active proposal to reject';
  end if;

  if active_proposal.receiver_user_id <> current_user_id then
    raise exception 'Only the receiver can reject this proposal';
  end if;

  if active_proposal.current_revision_id <> viewed_revision_id then
    raise exception 'Proposal changed since it was viewed';
  end if;

  if exists (
    select 1
    from public.proposals
    where group_id = target_group_id
      and status = 'draft'
      and current_author_user_id = active_proposal.current_author_user_id
      and id <> target_proposal_id
  ) then
    raise exception 'Sender already has a draft proposal';
  end if;

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    active_proposal.id,
    'rejected',
    current_user_id,
    viewed_revision_id
  );

  update public.proposals
  set status = 'draft',
      receiver_user_id = null,
      updated_at = now()
  where id = active_proposal.id;

  return active_proposal.id;
end;
$$;

create or replace function public.counter_active_proposal(
  target_group_id uuid,
  target_proposal_id uuid,
  viewed_revision_id uuid,
  proposed_schedule_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_proposal public.proposals%rowtype;
  viewed_revision public.proposal_revisions%rowtype;
  latest_calendar public.calendar_versions%rowtype;
  next_revision_number integer;
  created_revision_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into active_proposal
  from public.proposals
  where id = target_proposal_id
    and group_id = target_group_id
    and status = 'sent'
  limit 1;

  if active_proposal.id is null then
    raise exception 'No active proposal to counter';
  end if;

  if active_proposal.receiver_user_id <> current_user_id then
    raise exception 'Only the receiver can counter this proposal';
  end if;

  if active_proposal.current_revision_id <> viewed_revision_id then
    raise exception 'Proposal changed since it was viewed';
  end if;

  select *
    into viewed_revision
  from public.proposal_revisions
  where id = viewed_revision_id
    and proposal_id = active_proposal.id
  limit 1;

  if viewed_revision.id is null then
    raise exception 'Viewed proposal revision not found';
  end if;

  if not public.is_allowed_schedule_data_size(proposed_schedule_data) then
    raise exception 'Schedule data is too large';
  end if;

  select *
    into latest_calendar
  from public.calendar_versions
  where group_id = target_group_id
  order by version desc
  limit 1;

  if latest_calendar.id is null then
    raise exception 'No agreed calendar found';
  end if;

  if viewed_revision.base_calendar_version <> latest_calendar.version then
    raise exception 'Shared calendar changed since this proposal was created';
  end if;

  select coalesce(max(revision_number), 0) + 1
    into next_revision_number
  from public.proposal_revisions
  where proposal_id = active_proposal.id;

  insert into public.proposal_revisions (
    proposal_id,
    revision_number,
    author_user_id,
    base_calendar_version,
    schedule_data
  )
  values (
    active_proposal.id,
    next_revision_number,
    current_user_id,
    latest_calendar.version,
    proposed_schedule_data
  )
  returning id into created_revision_id;

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    active_proposal.id,
    'countered',
    current_user_id,
    created_revision_id
  );

  update public.proposals
  set current_author_user_id = current_user_id,
      receiver_user_id = active_proposal.current_author_user_id,
      current_revision_id = created_revision_id,
      updated_at = now()
  where id = active_proposal.id;

  return created_revision_id;
end;
$$;

create or replace function public.accept_active_proposal(
  target_group_id uuid,
  target_proposal_id uuid,
  viewed_revision_id uuid,
  promote_proposal_comments boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_proposal public.proposals%rowtype;
  accepted_revision public.proposal_revisions%rowtype;
  latest_calendar public.calendar_versions%rowtype;
  next_calendar_version integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into active_proposal
  from public.proposals
  where id = target_proposal_id
    and group_id = target_group_id
    and status = 'sent'
  limit 1;

  if active_proposal.id is null then
    raise exception 'No active proposal to accept';
  end if;

  if active_proposal.receiver_user_id <> current_user_id then
    raise exception 'Only the receiver can accept this proposal';
  end if;

  if active_proposal.current_revision_id <> viewed_revision_id then
    raise exception 'Proposal changed since it was viewed';
  end if;

  select *
    into accepted_revision
  from public.proposal_revisions
  where id = viewed_revision_id
    and proposal_id = active_proposal.id
  limit 1;

  if accepted_revision.id is null then
    raise exception 'Viewed proposal revision not found';
  end if;

  select *
    into latest_calendar
  from public.calendar_versions
  where group_id = target_group_id
  order by version desc
  limit 1;

  if latest_calendar.id is null then
    raise exception 'No agreed calendar found';
  end if;

  if accepted_revision.base_calendar_version <> latest_calendar.version then
    raise exception 'Shared calendar changed since this proposal was created';
  end if;

  next_calendar_version := latest_calendar.version + 1;

  insert into public.calendar_versions (
    group_id,
    version,
    schedule_data,
    accepted_proposal_id,
    created_by_user_id
  )
  values (
    target_group_id,
    next_calendar_version,
    accepted_revision.schedule_data,
    active_proposal.id,
    current_user_id
  );

  insert into public.proposal_status_events (
    proposal_id,
    status,
    actor_user_id,
    revision_id
  )
  values (
    active_proposal.id,
    'accepted',
    current_user_id,
    viewed_revision_id
  );

  if promote_proposal_comments then
    insert into public.shared_date_notes (
      group_id,
      author_user_id,
      date_key,
      body
    )
    select
      target_group_id,
      proposal_comments.author_user_id,
      proposal_comments.date_key,
      proposal_comments.body
    from public.proposal_comments
    where proposal_comments.proposal_id = active_proposal.id
      and proposal_comments.deleted_at is null;
  end if;

  update public.proposals
  set status = case
        when id = active_proposal.id then 'accepted'
        else 'withdrawn'
      end,
      receiver_user_id = case
        when id = active_proposal.id then receiver_user_id
        else null
      end,
      updated_at = now()
  where group_id = target_group_id
    and status in ('draft', 'sent');

  return next_calendar_version;
end;
$$;

create or replace function public.create_shared_date_note(
  target_group_id uuid,
  note_date_key date,
  note_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_note_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  if not public.is_allowed_text_body_size(note_body) then
    raise exception 'Shared date note is too long';
  end if;

  insert into public.shared_date_notes (
    group_id,
    author_user_id,
    date_key,
    body
  )
  values (
    target_group_id,
    current_user_id,
    note_date_key,
    note_body
  )
  returning id into created_note_id;

  return created_note_id;
end;
$$;

create or replace function public.update_shared_date_note(
  target_group_id uuid,
  target_note_id uuid,
  note_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_note public.shared_date_notes%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into existing_note
  from public.shared_date_notes
  where id = target_note_id
    and group_id = target_group_id
    and deleted_at is null
  limit 1;

  if existing_note.id is null then
    raise exception 'Note not found';
  end if;

  if existing_note.author_user_id <> current_user_id then
    raise exception 'Only the author can edit this note';
  end if;

  if not public.is_allowed_text_body_size(note_body) then
    raise exception 'Shared date note is too long';
  end if;

  update public.shared_date_notes
  set body = note_body,
      updated_at = now()
  where id = target_note_id;

  return target_note_id;
end;
$$;

create or replace function public.delete_shared_date_note(
  target_group_id uuid,
  target_note_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_note public.shared_date_notes%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select *
    into existing_note
  from public.shared_date_notes
  where id = target_note_id
    and group_id = target_group_id
    and deleted_at is null
  limit 1;

  if existing_note.id is null then
    raise exception 'Note not found';
  end if;

  if existing_note.author_user_id <> current_user_id then
    raise exception 'Only the author can delete this note';
  end if;

  update public.shared_date_notes
  set deleted_at = now(),
      updated_at = now()
  where id = target_note_id;

  return target_note_id;
end;
$$;

create or replace function public.create_proposal_comment(
  target_group_id uuid,
  target_proposal_id uuid,
  comment_date_key date,
  comment_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_comment_id uuid;
  proposal_exists boolean;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select exists (
    select 1
    from public.proposals
    where id = target_proposal_id
      and group_id = target_group_id
      and status in ('draft', 'sent')
  )
    into proposal_exists;

  if not proposal_exists then
    raise exception 'Proposal is not open for comments';
  end if;

  if not public.is_allowed_text_body_size(comment_body) then
    raise exception 'Proposal comment is too long';
  end if;

  insert into public.proposal_comments (
    proposal_id,
    author_user_id,
    date_key,
    body
  )
  values (
    target_proposal_id,
    current_user_id,
    comment_date_key,
    comment_body
  )
  returning id into created_comment_id;

  return created_comment_id;
end;
$$;

create or replace function public.update_proposal_comment(
  target_group_id uuid,
  target_proposal_id uuid,
  target_comment_id uuid,
  comment_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_comment public.proposal_comments%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select proposal_comments.*
    into existing_comment
  from public.proposal_comments
  join public.proposals
    on proposals.id = proposal_comments.proposal_id
  where proposal_comments.id = target_comment_id
    and proposal_comments.proposal_id = target_proposal_id
    and proposals.group_id = target_group_id
    and proposal_comments.deleted_at is null
  limit 1;

  if existing_comment.id is null then
    raise exception 'Comment not found';
  end if;

  if existing_comment.author_user_id <> current_user_id then
    raise exception 'Only the author can edit this comment';
  end if;

  if not public.is_allowed_text_body_size(comment_body) then
    raise exception 'Proposal comment is too long';
  end if;

  update public.proposal_comments
  set body = comment_body,
      updated_at = now()
  where id = target_comment_id;

  return target_comment_id;
end;
$$;

create or replace function public.delete_proposal_comment(
  target_group_id uuid,
  target_proposal_id uuid,
  target_comment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_comment public.proposal_comments%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_group_parent(target_group_id) then
    raise exception 'Parent does not belong to this custody group';
  end if;

  select proposal_comments.*
    into existing_comment
  from public.proposal_comments
  join public.proposals
    on proposals.id = proposal_comments.proposal_id
  where proposal_comments.id = target_comment_id
    and proposal_comments.proposal_id = target_proposal_id
    and proposals.group_id = target_group_id
    and proposal_comments.deleted_at is null
  limit 1;

  if existing_comment.id is null then
    raise exception 'Comment not found';
  end if;

  if existing_comment.author_user_id <> current_user_id then
    raise exception 'Only the author can delete this comment';
  end if;

  update public.proposal_comments
  set deleted_at = now(),
      updated_at = now()
  where id = target_comment_id;

  return target_comment_id;
end;
$$;

grant execute on function public.ensure_initial_group() to authenticated;
grant execute on function public.get_my_group_id() to authenticated;
grant execute on function public.regenerate_group_invite(uuid, text) to authenticated;
grant execute on function public.join_group_with_invite(text) to authenticated;
grant execute on function public.create_draft_proposal(uuid) to authenticated;
grant execute on function public.save_draft_proposal(uuid, jsonb) to authenticated;
grant execute on function public.send_draft_proposal(uuid, jsonb) to authenticated;
grant execute on function public.reset_draft_proposal(uuid) to authenticated;
grant execute on function public.withdraw_active_proposal(uuid, uuid, uuid) to authenticated;
grant execute on function public.discard_active_proposal(uuid, uuid, uuid) to authenticated;
grant execute on function public.reject_active_proposal(uuid, uuid, uuid) to authenticated;
grant execute on function public.counter_active_proposal(uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.accept_active_proposal(uuid, uuid, uuid, boolean) to authenticated;
grant execute on function public.create_shared_date_note(uuid, date, text) to authenticated;
grant execute on function public.update_shared_date_note(uuid, uuid, text) to authenticated;
grant execute on function public.delete_shared_date_note(uuid, uuid) to authenticated;
grant execute on function public.create_proposal_comment(uuid, uuid, date, text) to authenticated;
grant execute on function public.update_proposal_comment(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.delete_proposal_comment(uuid, uuid, uuid) to authenticated;
