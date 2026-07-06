-- BRL CV: herstructurering naar gas-toestel onderhouds-werkbon (secties + veldtypes).
-- Vervangt checklist-items op alle BRL 6000-25 templates; bestaande resultaten worden gewist.

do $$
declare
  tid uuid;
begin
  for tid in
    select id
    from public.checklist_templates
    where standard_code = 'BRL 6000-25'
       or name = 'CV Ketel Inspectie — BRL 6000-25'
  loop
    delete from public.photos ph
    using public.inspection_results ir
    join public.checklist_items ci on ci.id = ir.checklist_item_id
    where ph.inspection_result_id = ir.id
      and ci.template_id = tid;

    delete from public.inspection_results ir
    using public.checklist_items ci
    where ir.checklist_item_id = ci.id
      and ci.template_id = tid;

    delete from public.checklist_items where template_id = tid;

    insert into public.checklist_items (template_id, label, sort_order, item_kind, section_heading)
    values
      (tid, 'Serienummer vastgelegd', 0, 'text', 'Toestelgegevens & documentatie'),
      (tid, 'Machinenummer vastgelegd', 1, 'text', null),
      (tid, 'Installatieplaats / locatie vastgelegd', 2, 'text', null),
      (tid, 'Technische documentatie beschikbaar', 3, 'yes_no', null),
      (tid, 'CO-gehalte in de ruimte bij aanvang (ppm)', 4, 'text', 'CO vóór werkzaamheden'),
      (tid, 'Onderhoud uitgevoerd volgens fabrikantvoorschrift', 5, 'yes_no', 'Onderhoudsstatus'),
      (tid, 'Versie toegepaste fabrikantvoorschriften', 6, 'text', null),
      (tid, 'Veiligheidsklep gecontroleerd en in orde', 7, 'yes_no', null),
      (tid, 'Dynamische gasdruk hooglast (mbar)', 8, 'text', 'Gasvoorziening'),
      (tid, 'Dynamische gasdruk laaglast (mbar)', 9, 'text', null),
      (tid, 'Statische gasdruk (mbar)', 10, 'text', null),
      (tid, 'Gasdichtheid van het toestel', 11, 'pass_fail', null),
      (tid, 'Branderdruk hooglast (mbar)', 12, 'text', 'Verbrandingsmetingen'),
      (tid, 'Branderdruk laaglast (mbar)', 13, 'text', null),
      (tid, 'CO₂ hooglast (%)', 14, 'text', null),
      (tid, 'CO₂ laaglast (%)', 15, 'text', null),
      (tid, 'O₂ hooglast (%)', 16, 'text', null),
      (tid, 'O₂ laaglast (%)', 17, 'text', null),
      (tid, 'Uitvoering conform fabrikant en NPR 3378', 18, 'pass_fail', 'Rookgasafvoer'),
      (tid, 'Type doorvoer (bijv. dak, gevel)', 19, 'text', null),
      (tid, 'Uitvoering (bijv. concentrisch / parallel)', 20, 'text', null),
      (tid, 'Conditie rookgasafvoer', 21, 'pass_fail', null),
      (tid, 'Voldoende trek bij B11-toestel', 22, 'pass_fail', null),
      (tid, 'Beugeling conform geldende norm', 23, 'pass_fail', null),
      (tid, 'Stormbeugel bij dakdoorvoer aanwezig', 24, 'yes_no', null),
      (tid, 'Condensafvoer in orde', 25, 'pass_fail', null),
      (tid, 'CO-melder aanwezig', 26, 'yes_no', 'Opstellingsruimte'),
      (tid, 'Ruimte, montage en ventilatie conform NPR 3378-22', 27, 'pass_fail', null),
      (tid, 'Opstelling conform installatievoorschrift fabrikant', 28, 'pass_fail', null),
      (tid, 'Installatie- of gebruikershandleiding aanwezig', 29, 'yes_no', null),
      (tid, 'Alle verplichte controles kunnen worden uitgevoerd', 30, 'yes_no', 'Eindcontrole'),
      (tid, 'CO-gehalte in de ruimte na afronding (ppm)', 31, 'text', 'CO na werkzaamheden'),
      (tid, 'Gebruikte meetinstrumenten vastgelegd', 32, 'text', 'Meetapparatuur'),
      (tid, 'Vrije opmerkingen voor het rapport', 33, 'text', 'Opmerkingen');
  end loop;
end;
$$;
