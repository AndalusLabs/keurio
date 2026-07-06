-- Zet item_kind + section_heading goed op BRL-templates (zonder data te wissen).
-- Idempotent: veilig opnieuw te draaien na 00021.

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
    update public.checklist_items ci
    set
      item_kind = v.kind,
      section_heading = v.section_heading
    from (
      values
        (0, 'text', 'Toestelgegevens & documentatie'),
        (1, 'text', null::text),
        (2, 'text', null),
        (3, 'yes_no', null),
        (4, 'text', 'CO vóór werkzaamheden'),
        (5, 'yes_no', 'Onderhoudsstatus'),
        (6, 'text', null),
        (7, 'yes_no', null),
        (8, 'text', 'Gasvoorziening'),
        (9, 'text', null),
        (10, 'text', null),
        (11, 'pass_fail', null),
        (12, 'text', 'Verbrandingsmetingen'),
        (13, 'text', null),
        (14, 'text', null),
        (15, 'text', null),
        (16, 'text', null),
        (17, 'text', null),
        (18, 'pass_fail', 'Rookgasafvoer'),
        (19, 'text', null),
        (20, 'text', null),
        (21, 'pass_fail', null),
        (22, 'pass_fail', null),
        (23, 'pass_fail', null),
        (24, 'yes_no', null),
        (25, 'pass_fail', null),
        (26, 'yes_no', 'Opstellingsruimte'),
        (27, 'pass_fail', null),
        (28, 'pass_fail', null),
        (29, 'yes_no', null),
        (30, 'yes_no', 'Eindcontrole'),
        (31, 'text', 'CO na werkzaamheden'),
        (32, 'text', 'Meetapparatuur'),
        (33, 'text', 'Opmerkingen')
    ) as v(sort_order, kind, section_heading)
    where ci.template_id = tid
      and ci.sort_order = v.sort_order;
  end loop;
end;
$$;