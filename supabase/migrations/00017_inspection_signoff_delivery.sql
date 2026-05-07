-- Inspection sign-off + delivery metadata
alter table public.inspections
  add column if not exists signed_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists sent_to_email text;

-- Private storage bucket for generated report files shared via signed URLs.
insert into storage.buckets (id, name, public)
values ('inspection-reports', 'inspection-reports', false)
on conflict (id) do nothing;

create policy "Inspection reports upload own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'inspection-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Inspection reports read own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'inspection-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Inspection reports update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'inspection-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Inspection reports delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'inspection-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );
