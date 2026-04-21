-- Backfill default HVAC template for orgs that have zero org-scoped templates (e.g. created before app seeding).
-- Runs as SECURITY DEFINER so any org member can trigger it; membership is verified.

create or replace function public.ensure_org_default_templates(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tpl record;
  new_tid uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  if not public.is_org_member(p_org_id, auth.uid()) then
    raise exception 'forbidden';
  end if;

  if exists (select 1 from public.checklist_templates t where t.organization_id = p_org_id limit 1) then
    return;
  end if;

  for tpl in
    select id, name
    from public.checklist_templates
    where is_system = true
      and is_default = true
      and organization_id is null
  loop
    new_tid := gen_random_uuid();
    insert into public.checklist_templates (id, user_id, organization_id, name, is_default, is_system)
    values (new_tid, auth.uid(), p_org_id, tpl.name, true, false);

    insert into public.checklist_items (template_id, label, sort_order)
    select new_tid, ci.label, ci.sort_order
    from public.checklist_items ci
    where ci.template_id = tpl.id
    order by ci.sort_order;
  end loop;
end;
$$;

revoke all on function public.ensure_org_default_templates(uuid) from public;
grant execute on function public.ensure_org_default_templates(uuid) to authenticated;
