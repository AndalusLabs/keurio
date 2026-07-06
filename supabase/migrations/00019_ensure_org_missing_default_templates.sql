-- Previously, ensure_org_default_templates exited as soon as the org had *any* template.
-- New global defaults (e.g. CV Ketel BRL) were never copied for existing orgs.
-- Now: copy each global default only when the org does not already have an equivalent.

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

  for tpl in
    select id, name, standard_code
    from public.checklist_templates
    where is_system = true
      and is_default = true
      and organization_id is null
  loop
    if exists (
      select 1
      from public.checklist_templates t
      where t.organization_id = p_org_id
        and lower(trim(t.name)) = lower(trim(tpl.name))
    ) then
      continue;
    end if;

    if tpl.standard_code is not null then
      if exists (
        select 1
        from public.checklist_templates t
        where t.organization_id = p_org_id
          and t.standard_code is not distinct from tpl.standard_code
      ) then
        continue;
      end if;
    end if;

    new_tid := gen_random_uuid();
    insert into public.checklist_templates (id, user_id, organization_id, name, is_default, is_system, standard_code)
    select new_tid, auth.uid(), p_org_id, ct.name, true, false, ct.standard_code
    from public.checklist_templates ct
    where ct.id = tpl.id;

    insert into public.checklist_items (template_id, label, sort_order, item_kind, section_heading)
    select new_tid, ci.label, ci.sort_order, ci.item_kind, ci.section_heading
    from public.checklist_items ci
    where ci.template_id = tpl.id
    order by ci.sort_order;
  end loop;
end;
$$;
