-- Allow invite page to show who the invite is for (token is the secret; anyone with the link can see the email).

create or replace function public.peek_org_invite(p_token text)
returns table (email text, accepted_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select i.email, i.accepted_at
  from public.organization_invites i
  where i.token = p_token
  limit 1;
$$;

grant execute on function public.peek_org_invite(text) to anon, authenticated;
