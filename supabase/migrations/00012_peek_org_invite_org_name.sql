-- Include organization name for branded invite / signup copy.
-- Postgres does not allow changing OUT/RETURNS TABLE shape with CREATE OR REPLACE alone.

drop function if exists public.peek_org_invite(text);

create function public.peek_org_invite(p_token text)
returns table (email text, accepted_at timestamptz, organization_name text)
language sql
stable
security definer
set search_path = public
as $$
  select i.email, i.accepted_at, o.name::text as organization_name
  from public.organization_invites i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token
  limit 1;
$$;

grant execute on function public.peek_org_invite(text) to anon, authenticated;
