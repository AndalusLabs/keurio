-- Clients (per user) + optional link from inspections

create table public.clients (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  notes text,
  created_at timestamptz default now() not null
);

create index clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

create policy "Users see own clients"
  on public.clients for all
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

alter table public.inspections
  add column client_id uuid references public.clients (id) on delete set null;

create index inspections_client_id_idx on public.inspections (client_id);
