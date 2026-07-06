-- BRL CV: geen klant- of handtekeningregels (client + sign-off flow zoals Airco).
-- Installatie, metingen en BRL-checklist alleen als pass/fail; waarden in opmerkingen.
-- Na verwijdering van sort 0–4 en 39–43: 34 regels (oud 5–38), sort_order → 0–33.

do $$
declare
  tid uuid;
  migrated boolean;
begin
  for tid in
    select id
    from public.checklist_templates
    where standard_code = 'BRL 6000-25'
       or name = 'CV Ketel Inspectie — BRL 6000-25'
  loop
    select exists (
      select 1
      from public.checklist_items ci
      where ci.template_id = tid
        and ci.sort_order = 0
        and ci.label like 'Type installatie gecontroleerd%'
    ) into migrated;

    if migrated or not exists (select 1 from public.checklist_items where template_id = tid) then
      continue;
    end if;

    delete from public.inspection_results ir
    using public.checklist_items ci
    where ir.checklist_item_id = ci.id
      and ci.template_id = tid
      and ci.sort_order in (0, 1, 2, 3, 4, 39, 40, 41, 42, 43);

    delete from public.checklist_items
    where template_id = tid
      and sort_order in (0, 1, 2, 3, 4, 39, 40, 41, 42, 43);

    update public.checklist_items
    set sort_order = sort_order - 5
    where template_id = tid;

    update public.checklist_items
    set item_kind = 'pass_fail',
        section_heading = null
    where template_id = tid;

    update public.checklist_items
    set label = case sort_order
      when 0 then 'Type installatie gecontroleerd (CV / warmtepomp / combi — noteer bij opmerkingen)'
      when 1 then 'Merk vastgelegd (noteer bij opmerkingen)'
      when 2 then 'Toesteltype / model vastgelegd (noteer bij opmerkingen)'
      when 3 then 'Serienummer vastgelegd (noteer bij opmerkingen)'
      when 4 then 'Bouwjaar vastgelegd (noteer bij opmerkingen)'
      when 5 then 'Type toestel A/B/C vastgelegd (noteer bij opmerkingen)'
      when 6 then 'Vermogen (kW) genoteerd (noteer bij opmerkingen)'
      when 7 then 'Type rookgasafvoer beoordeeld (noteer bij opmerkingen)'
      when 8 then 'Project- / werknummer genoteerd (leeg = automatisch op rapport)'
      when 9 then 'CO ruimte bij binnenkomst (ppm — noteer bij opmerkingen)'
      when 10 then 'CO ruimte bij inbedrijfstelling (ppm — noteer bij opmerkingen)'
      when 11 then 'Rookgastemperatuur hooglast (°C — noteer bij opmerkingen)'
      when 12 then 'Rookgastemperatuur laaglast (°C — noteer bij opmerkingen)'
      when 13 then 'CO rookgas hooglast (ppm — noteer bij opmerkingen)'
      when 14 then 'CO rookgas laaglast (ppm — noteer bij opmerkingen)'
      when 15 then 'CO₂ percentage hooglast (% — noteer bij opmerkingen)'
      when 16 then 'CO₂ percentage laaglast (% — noteer bij opmerkingen)'
      when 17 then 'O₂ percentage hooglast (% — noteer bij opmerkingen)'
      when 18 then 'Rendement hooglast (% — noteer bij opmerkingen)'
      when 19 then 'Gasdruk (mbar — noteer bij opmerkingen)'
      when 20 then 'Geen lekkage aanvoerleiding (visueel gecontroleerd)'
      when 21 then 'Luchttoevoer vrij van obstakels'
      when 22 then 'Rookgasafvoer visueel in orde'
      when 23 then 'Condensaatafvoer functioneert'
      when 24 then 'Veiligheidsklep aanwezig en functioneel'
      when 25 then 'Expansievat druk gecontroleerd'
      when 26 then 'Waterdruk installatie correct (1–2 bar)'
      when 27 then 'Filters gereinigd'
      when 28 then 'Brander visueel gecontroleerd'
      when 29 then 'Warmtewisselaar gereinigd'
      when 30 then 'Elektrische aansluitingen gecontroleerd'
      when 31 then 'CO-melder beoordeeld (ja / nee / geadviseerd — noteer bij opmerkingen)'
      when 32 then 'Toestel in bedrijf gesteld en getest'
      when 33 then 'Klant geïnformeerd over bevindingen'
      else label
    end
    where template_id = tid;
  end loop;
end;
$$;
