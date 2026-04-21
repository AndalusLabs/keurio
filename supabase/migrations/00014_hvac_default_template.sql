-- Default HVAC / airco checklist template (global, copied into each new organization).

alter table public.checklist_templates
  add column if not exists is_default boolean not null default false;

alter table public.checklist_templates
  add column if not exists is_system boolean not null default false;

alter table public.checklist_templates
  alter column user_id drop not null;

-- Authenticated users can read system templates + items (for copy into org).
drop policy if exists "Anyone authenticated reads system templates" on public.checklist_templates;
drop policy if exists "Anyone authenticated reads system template items" on public.checklist_items;

create policy "Anyone authenticated reads system templates"
  on public.checklist_templates for select
  to authenticated
  using (is_system = true and organization_id is null);

create policy "Anyone authenticated reads system template items"
  on public.checklist_items for select
  to authenticated
  using (
    exists (
      select 1 from public.checklist_templates t
      where t.id = checklist_items.template_id
        and t.is_system = true
        and t.organization_id is null
    )
  );

-- Seed global system template (once).
insert into public.checklist_templates (name, is_default, is_system, organization_id, user_id)
select 'Airco / Split-unit inspectie', true, true, null, null
where not exists (
  select 1 from public.checklist_templates t
  where t.is_system = true and t.name = 'Airco / Split-unit inspectie'
);

insert into public.checklist_items (template_id, label, sort_order)
select t.id, v.label, v.sort_order
from public.checklist_templates t
cross join (
  values
    (0, 'Visuele inspectie buitenunit'),
    (1, 'Visuele inspectie binnenunit'),
    (2, 'Filters gecontroleerd en gereinigd'),
    (3, 'Koudemiddeldruk hoge zijde gemeten (bar)'),
    (4, 'Koudemiddeldruk lage zijde gemeten (bar)'),
    (5, 'Lekcontrole uitgevoerd'),
    (6, 'Lekkage geconstateerd (ja/nee)'),
    (7, 'Type koudemiddel'),
    (8, 'Hoeveelheid koudemiddel bijgevuld (gram)'),
    (9, 'Condensafvoer gecontroleerd en doorgespoeld'),
    (10, 'Electrische aansluitingen gecontroleerd'),
    (11, 'Behuizing en panelen gecontroleerd'),
    (12, 'Testrun uitgevoerd'),
    (13, 'Koeling getest en werkend'),
    (14, 'Verwarming getest en werkend'),
    (15, 'Algemene bevindingen en aanbevelingen')
) as v(sort_order, label)
where t.is_system = true
  and t.name = 'Airco / Split-unit inspectie'
  and not exists (
    select 1 from public.checklist_items i where i.template_id = t.id
  );
