-- Fix infinite recursion in RLS for organization_members by using SECURITY DEFINER helpers.

-- Drop any policies that might depend on older helper overloads.
drop policy if exists "Members see their organization" on public.organizations;
drop policy if exists "Members manage their organization" on public.organizations;

-- Cleanup any previous overloads (avoid "is not unique")
drop function if exists public.is_org_member(uuid) cascade;
drop function if exists public.is_org_member(uuid, uuid) cascade;
drop function if exists public.is_org_admin(uuid) cascade;
drop function if exists public.is_org_admin(uuid, uuid) cascade;

-- Helper: read JWT email claim (Supabase sets request.jwt.claim.*)
create or replace function public.jwt_email()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$;

-- SECURITY DEFINER helpers bypass RLS and avoid self-referential recursion.
create or replace function public.is_org_member(org_id uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id and m.user_id = uid
  );
$$;

create or replace function public.is_org_admin(org_id uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id and m.user_id = uid and m.role = 'admin'
  );
$$;

-- RPC: create org + add current user as admin (for onboarding)
create or replace function public.create_organization_and_admin(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  insert into public.organizations (name)
  values (trim(org_name))
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'admin');

  return new_org_id;
end;
$$;

-- RPC: accept invite by token (signup link)
create or replace function public.accept_org_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  email_claim text;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  email_claim := public.jwt_email();
  if email_claim is null then
    raise exception 'missing_email_claim';
  end if;

  select *
  into inv
  from public.organization_invites i
  where i.token = invite_token
  limit 1;

  if inv is null then
    raise exception 'invalid_invite';
  end if;

  if inv.accepted_at is not null then
    return inv.organization_id;
  end if;

  if lower(inv.email) <> lower(email_claim) then
    raise exception 'invite_email_mismatch';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (inv.organization_id, auth.uid(), inv.role)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invites
  set accepted_at = now()
  where id = inv.id;

  return inv.organization_id;
end;
$$;

-- Recreate organization_members policies without self-referential subqueries.
drop policy if exists "Members see own memberships" on public.organization_members;
drop policy if exists "Admins manage memberships" on public.organization_members;
drop policy if exists "First member can bootstrap admin" on public.organization_members;

create policy "Members read org memberships"
  on public.organization_members for select
  using (public.is_org_member(organization_id, auth.uid()));

create policy "Admins manage memberships"
  on public.organization_members for insert
  with check (public.is_org_admin(organization_id, auth.uid()));

create policy "Admins update memberships"
  on public.organization_members for update
  using (public.is_org_admin(organization_id, auth.uid()))
  with check (public.is_org_admin(organization_id, auth.uid()));

create policy "Admins delete memberships"
  on public.organization_members for delete
  using (public.is_org_admin(organization_id, auth.uid()));

