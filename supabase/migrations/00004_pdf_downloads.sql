-- Log PDF report downloads (each GET on /api/inspections/:id/pdf)

create table public.inspection_pdf_downloads (
  id uuid primary key default gen_random_uuid (),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz default now() not null
);

create index inspection_pdf_downloads_user_id_idx on public.inspection_pdf_downloads (user_id);

create index inspection_pdf_downloads_created_at_idx on public.inspection_pdf_downloads (created_at);

alter table public.inspection_pdf_downloads enable row level security;

create policy "PDF downloads own rows"
  on public.inspection_pdf_downloads for all
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);
