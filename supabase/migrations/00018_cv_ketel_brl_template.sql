-- BRL 6000-25 CV ketel inspection template + item metadata (sections, field kinds).

alter table public.checklist_templates
  add column if not exists standard_code text;

alter table public.checklist_items
  add column if not exists item_kind text not null default 'pass_fail'
    constraint checklist_items_item_kind_check
    check (item_kind in ('pass_fail', 'text', 'yes_no'));

alter table public.checklist_items
  add column if not exists section_heading text;

comment on column public.checklist_items.item_kind is 'pass_fail: checklist; text: value in notes; yes_no: Ja=pass, Nee=fail';
comment on column public.checklist_items.section_heading is 'When set, starts a new section (shown before this item in UI/PDF).';
comment on column public.checklist_templates.standard_code is 'Optional standard reference (e.g. BRL 6000-25) for badges and PDF layout.';

-- Copy new columns when seeding org defaults
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

-- Global system template: CV Ketel — BRL 6000-25
insert into public.checklist_templates (name, is_default, is_system, organization_id, user_id, standard_code)
select 'CV Ketel Inspectie — BRL 6000-25', true, true, null, null, 'BRL 6000-25'
where not exists (
  select 1 from public.checklist_templates t
  where t.is_system = true
    and t.organization_id is null
    and t.standard_code = 'BRL 6000-25'
);

insert into public.checklist_items (template_id, label, sort_order, item_kind, section_heading)
select t.id, v.label, v.sort_order, v.item_kind, null
from public.checklist_templates t
cross join (
  values
    (0, 'Type installatie gecontroleerd (CV / warmtepomp / combi — noteer bij opmerkingen)', 'pass_fail'),
    (1, 'Merk vastgelegd (noteer bij opmerkingen)', 'pass_fail'),
    (2, 'Toesteltype / model vastgelegd (noteer bij opmerkingen)', 'pass_fail'),
    (3, 'Serienummer vastgelegd (noteer bij opmerkingen)', 'pass_fail'),
    (4, 'Bouwjaar vastgelegd (noteer bij opmerkingen)', 'pass_fail'),
    (5, 'Type toestel A/B/C vastgelegd (noteer bij opmerkingen)', 'pass_fail'),
    (6, 'Vermogen (kW) genoteerd (noteer bij opmerkingen)', 'pass_fail'),
    (7, 'Type rookgasafvoer beoordeeld (noteer bij opmerkingen)', 'pass_fail'),
    (8, 'Project- / werknummer genoteerd (leeg = automatisch op rapport)', 'pass_fail'),
    (9, 'CO ruimte bij binnenkomst (ppm — noteer bij opmerkingen)', 'pass_fail'),
    (10, 'CO ruimte bij inbedrijfstelling (ppm — noteer bij opmerkingen)', 'pass_fail'),
    (11, 'Rookgastemperatuur hooglast (°C — noteer bij opmerkingen)', 'pass_fail'),
    (12, 'Rookgastemperatuur laaglast (°C — noteer bij opmerkingen)', 'pass_fail'),
    (13, 'CO rookgas hooglast (ppm — noteer bij opmerkingen)', 'pass_fail'),
    (14, 'CO rookgas laaglast (ppm — noteer bij opmerkingen)', 'pass_fail'),
    (15, 'CO₂ percentage hooglast (% — noteer bij opmerkingen)', 'pass_fail'),
    (16, 'CO₂ percentage laaglast (% — noteer bij opmerkingen)', 'pass_fail'),
    (17, 'O₂ percentage hooglast (% — noteer bij opmerkingen)', 'pass_fail'),
    (18, 'Rendement hooglast (% — noteer bij opmerkingen)', 'pass_fail'),
    (19, 'Gasdruk (mbar — noteer bij opmerkingen)', 'pass_fail'),
    (20, 'Geen lekkage aanvoerleiding (visueel gecontroleerd)', 'pass_fail'),
    (21, 'Luchttoevoer vrij van obstakels', 'pass_fail'),
    (22, 'Rookgasafvoer visueel in orde', 'pass_fail'),
    (23, 'Condensaatafvoer functioneert', 'pass_fail'),
    (24, 'Veiligheidsklep aanwezig en functioneel', 'pass_fail'),
    (25, 'Expansievat druk gecontroleerd', 'pass_fail'),
    (26, 'Waterdruk installatie correct (1–2 bar)', 'pass_fail'),
    (27, 'Filters gereinigd', 'pass_fail'),
    (28, 'Brander visueel gecontroleerd', 'pass_fail'),
    (29, 'Warmtewisselaar gereinigd', 'pass_fail'),
    (30, 'Elektrische aansluitingen gecontroleerd', 'pass_fail'),
    (31, 'CO-melder beoordeeld (ja / nee / geadviseerd — noteer bij opmerkingen)', 'pass_fail'),
    (32, 'Toestel in bedrijf gesteld en getest', 'pass_fail'),
    (33, 'Klant geïnformeerd over bevindingen', 'pass_fail')
) as v(sort_order, label, item_kind)
where t.is_system = true
  and t.standard_code = 'BRL 6000-25'
  and not exists (
    select 1 from public.checklist_items i where i.template_id = t.id
  );
