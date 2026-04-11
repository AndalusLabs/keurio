-- Multi-tenant organizations + membership + invites

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz default now() not null
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'technician' check (role in ('admin', 'technician')),
  created_at timestamptz default now() not null,
  unique (organization_id, user_id)
);

-- Pending email invites (needed because auth.users may not exist yet)
create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null default 'technician' check (role in ('admin', 'technician')),
  token text not null unique,
  created_at timestamptz default now() not null,
  accepted_at timestamptz
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_org_id_idx on public.organization_members (organization_id);
create index organization_invites_org_id_idx on public.organization_invites (organization_id);
create index organization_invites_email_idx on public.organization_invites (email);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

-- Organizations: members can manage their org; any authenticated user can create a new org
create policy "Members manage their organization"
  on public.organizations for all
  using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  )
  with check (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Authenticated create organization"
  on public.organizations for insert
  with check (auth.uid() is not null);

-- Membership rows: members can see their own memberships; first member can self-assign admin; admins manage within org
create policy "Members see own memberships"
  on public.organization_members for select
  using (user_id = auth.uid());

create policy "First member can bootstrap admin"
  on public.organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and not exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_members.organization_id
    )
  );

create policy "Admins manage memberships"
  on public.organization_members for all
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_members.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_members.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Invites: admins manage within org; members can read invites for their org (optional)
create policy "Admins manage invites"
  on public.organization_invites for all
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_invites.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_invites.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Add organization_id to existing tables
alter table public.inspections add column organization_id uuid references public.organizations (id);
alter table public.clients add column organization_id uuid references public.organizations (id);
alter table public.checklist_templates add column organization_id uuid references public.organizations (id);

create index inspections_org_id_idx on public.inspections (organization_id);
create index clients_org_id_idx on public.clients (organization_id);
create index checklist_templates_org_id_idx on public.checklist_templates (organization_id);

-- Updated RLS:
-- Inspections: admins see all in org; technicians only their own inspections in org
drop policy if exists "Inspections own rows" on public.inspections;
create policy "Inspections by org + role"
  on public.inspections for all
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = inspections.organization_id
        and m.user_id = auth.uid()
        and (
          m.role = 'admin'
          or inspections.user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = inspections.organization_id
        and m.user_id = auth.uid()
        and (
          m.role = 'admin'
          or inspections.user_id = auth.uid()
        )
    )
  );

-- Clients: all org members can read; only admins can write
drop policy if exists "Users see own clients" on public.clients;
create policy "Clients read by org"
  on public.clients for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
    )
  );

create policy "Clients write by admin"
  on public.clients for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

create policy "Clients update by admin"
  on public.clients for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

create policy "Clients delete by admin"
  on public.clients for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Templates: all org members can read; only admins can write
drop policy if exists "Templates own rows" on public.checklist_templates;
create policy "Templates read by org"
  on public.checklist_templates for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = checklist_templates.organization_id
        and m.user_id = auth.uid()
    )
  );

create policy "Templates write by admin"
  on public.checklist_templates for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = checklist_templates.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

create policy "Templates update by admin"
  on public.checklist_templates for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = checklist_templates.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = checklist_templates.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

create policy "Templates delete by admin"
  on public.checklist_templates for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = checklist_templates.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Checklist items: via template org membership; admins write
drop policy if exists "Items via template" on public.checklist_items;
create policy "Items read by org"
  on public.checklist_items for select
  using (
    exists (
      select 1
      from public.checklist_templates t
      join public.organization_members m on m.organization_id = t.organization_id
      where t.id = checklist_items.template_id
        and m.user_id = auth.uid()
    )
  );

create policy "Items write by admin"
  on public.checklist_items for all
  using (
    exists (
      select 1
      from public.checklist_templates t
      join public.organization_members m on m.organization_id = t.organization_id
      where t.id = checklist_items.template_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.checklist_templates t
      join public.organization_members m on m.organization_id = t.organization_id
      where t.id = checklist_items.template_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Results: admins see all in org; technicians only their own inspection results
drop policy if exists "Results via inspection" on public.inspection_results;
create policy "Results by org + role"
  on public.inspection_results for all
  using (
    exists (
      select 1
      from public.inspections i
      join public.organization_members m
        on m.organization_id = i.organization_id
      where i.id = inspection_results.inspection_id
        and m.user_id = auth.uid()
        and (m.role = 'admin' or i.user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.inspections i
      join public.organization_members m
        on m.organization_id = i.organization_id
      where i.id = inspection_results.inspection_id
        and m.user_id = auth.uid()
        and (m.role = 'admin' or i.user_id = auth.uid())
    )
  );

-- Photos: same rule via result -> inspection
drop policy if exists "Photos via result" on public.photos;
create policy "Photos by org + role"
  on public.photos for all
  using (
    exists (
      select 1
      from public.inspection_results r
      join public.inspections i on i.id = r.inspection_id
      join public.organization_members m on m.organization_id = i.organization_id
      where r.id = photos.inspection_result_id
        and m.user_id = auth.uid()
        and (m.role = 'admin' or i.user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.inspection_results r
      join public.inspections i on i.id = r.inspection_id
      join public.organization_members m on m.organization_id = i.organization_id
      where r.id = photos.inspection_result_id
        and m.user_id = auth.uid()
        and (m.role = 'admin' or i.user_id = auth.uid())
    )
  );
