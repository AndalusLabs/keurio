-- 00007 dropped organization policies without restoring SELECT. Members could not read
-- organization rows, so server-side fetches of org name failed and the workspace switcher stayed hidden.

drop policy if exists "Members read their organization" on public.organizations;

create policy "Members read their organization"
  on public.organizations for select
  using (public.is_org_member(id, auth.uid()));
