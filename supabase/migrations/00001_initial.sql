-- Keurio schema — run in Supabase SQL editor or via CLI

-- Profiles mirror auth.users (table name "users" per product spec)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz default now() not null
);

alter table public.checklist_templates enable row level security;

create policy "Templates own rows"
  on public.checklist_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz default now() not null
);

alter table public.checklist_items enable row level security;

create policy "Items via template"
  on public.checklist_items for all
  using (
    exists (
      select 1 from public.checklist_templates t
      where t.id = checklist_items.template_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.checklist_templates t
      where t.id = checklist_items.template_id and t.user_id = auth.uid()
    )
  );

create type public.inspection_status as enum ('draft', 'in_progress', 'completed');

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  template_id uuid not null references public.checklist_templates (id) on delete restrict,
  title text not null,
  site_name text,
  status public.inspection_status not null default 'draft',
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

alter table public.inspections enable row level security;

create policy "Inspections own rows"
  on public.inspections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create type public.result_status as enum ('pass', 'fail');

create table public.inspection_results (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items (id) on delete cascade,
  status public.result_status,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (inspection_id, checklist_item_id)
);

alter table public.inspection_results enable row level security;

create policy "Results via inspection"
  on public.inspection_results for all
  using (
    exists (
      select 1 from public.inspections i
      where i.id = inspection_results.inspection_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.inspections i
      where i.id = inspection_results.inspection_id and i.user_id = auth.uid()
    )
  );

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  inspection_result_id uuid not null references public.inspection_results (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now() not null
);

alter table public.photos enable row level security;

create policy "Photos via result"
  on public.photos for all
  using (
    exists (
      select 1 from public.inspection_results r
      join public.inspections i on i.id = r.inspection_id
      where r.id = photos.inspection_result_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.inspection_results r
      join public.inspections i on i.id = r.inspection_id
      where r.id = photos.inspection_result_id and i.user_id = auth.uid()
    )
  );

-- Trigger: new auth user -> public.users row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket (create in Dashboard: bucket name "inspection-photos", public read optional)
-- Policies example:
-- insert: authenticated, path starts with auth.uid()

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inspection_results_updated
  before update on public.inspection_results
  for each row execute function public.set_updated_at();
