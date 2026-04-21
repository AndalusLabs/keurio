-- Compare invite email to the canonical address in auth.users (source of truth).
-- JWT "email" can differ from what Supabase stores (casing, provider quirks).

create or replace function public.accept_org_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  session_email text;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select u.email into session_email
  from auth.users u
  where u.id = auth.uid();

  session_email := nullif(
    trim(
      coalesce(
        session_email,
        public.jwt_email()
      )
    ),
    ''
  );
  if session_email is null then
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

  if lower(trim(inv.email)) <> lower(session_email) then
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
