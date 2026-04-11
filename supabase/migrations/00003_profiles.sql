-- Company + user profile settings (Keurio /settings)

create table public.company_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  company_name text,
  logo_storage_path text,
  address_street text,
  address_city text,
  address_postal_code text,
  phone text,
  kvk_number text,
  website_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.company_profiles enable row level security;

create policy "Company profile own row"
  on public.company_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.user_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  first_name text,
  last_name text,
  job_title text,
  signature_storage_path text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.user_profiles enable row level security;

create policy "User profile own row"
  on public.user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_profile_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger company_profiles_updated
  before update on public.company_profiles
  for each row execute function public.set_profile_updated_at();

create trigger user_profiles_updated
  before update on public.user_profiles
  for each row execute function public.set_profile_updated_at();

-- Storage: bucket profile-assets (public read for PDFs / previews)

insert into storage.buckets (id, name, public)
values ('profile-assets', 'profile-assets', true)
on conflict (id) do nothing;

create policy "Profile assets upload own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Profile assets update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Profile assets delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-assets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Public read profile assets"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-assets');
