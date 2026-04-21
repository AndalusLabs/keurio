-- jwt_email() used request.jwt.claim.email, which is often empty when PostgREST runs RPCs.
-- Supabase exposes the session JWT via auth.jwt() ->> 'email'.

create or replace function public.jwt_email()
returns text
language sql
stable
as $$
  select nullif(
    trim(
      coalesce(
        auth.jwt() ->> 'email',
        nullif(current_setting('request.jwt.claim.email', true), '')::text
      )
    ),
    ''
  );
$$;
