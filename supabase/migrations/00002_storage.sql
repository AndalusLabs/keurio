-- Run after creating bucket "inspection-photos" in Supabase Dashboard (public read optional).

insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', true)
on conflict (id) do nothing;

create policy "Authenticated upload own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'inspection-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Authenticated update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'inspection-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Authenticated delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'inspection-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Public read inspection photos"
  on storage.objects for select
  to public
  using (bucket_id = 'inspection-photos');
