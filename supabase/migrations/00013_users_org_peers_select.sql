-- Allow org members to read basic profile (email, name) of teammates for the Team page.

create policy "Members read org peer profiles"
  on public.users for select
  using (
    exists (
      select 1
      from public.organization_members m1
      inner join public.organization_members m2
        on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid()
        and m2.user_id = users.id
    )
  );
