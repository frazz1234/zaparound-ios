-- Featured Destinations base table
create table if not exists public.featured_destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  city text not null,
  country text not null,
  image_url text,           -- optional custom image; fallback to /zaparound-uploads/defaultimage.png
  fallback_image_url text,  -- optional secondary image
  rating numeric(3,2) default 4.5 not null,
  review_count integer default 0 not null,
  price_min_cents integer default 0 not null,
  currency text default 'USD' not null,
  badge_key text default 'Popular' not null, -- default label key (can be overridden in translations)
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Translations table (one row per locale)
create table if not exists public.featured_destination_translations (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.featured_destinations(id) on delete cascade,
  locale text not null check (locale in ('en','fr','es')),
  name text not null,              -- e.g., 'Paris, France'
  badge text,                      -- e.g., 'Trending'
  price_label text,                -- e.g., 'From $899'
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(destination_id, locale)
);

-- Indexes
create index if not exists idx_featured_destinations_active_order on public.featured_destinations(is_active, sort_order);
create index if not exists idx_featured_destinations_slug on public.featured_destinations(slug);
create index if not exists idx_featured_destination_translations_locale on public.featured_destination_translations(locale);

-- RLS
alter table public.featured_destinations enable row level security;
alter table public.featured_destination_translations enable row level security;

-- Policies: allow public read (anon) for listing
create policy if not exists "Allow anon read featured_destinations"
  on public.featured_destinations for select
  using ( true );

create policy if not exists "Allow anon read featured_destination_translations"
  on public.featured_destination_translations for select
  using ( true );

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_featured_destinations
before update on public.featured_destinations
for each row execute function public.set_updated_at();

create trigger set_updated_at_featured_destination_translations
before update on public.featured_destination_translations
for each row execute function public.set_updated_at();

-- Seed minimal examples (optional)
insert into public.featured_destinations (slug, city, country, sort_order, rating, review_count, price_min_cents, currency, badge_key)
values
  ('paris-france','Paris','France', 1, 4.80, 1247, 89900, 'USD', 'Popular'),
  ('tokyo-japan','Tokyo','Japan', 2, 4.90, 892, 129900, 'USD', 'Trending'),
  ('new-york-usa','New York','USA', 3, 4.70, 2156, 69900, 'USD', 'Best Value')
on conflict (slug) do nothing;

insert into public.featured_destination_translations (destination_id, locale, name, badge, price_label)
select id, 'en', city || ', ' || country, badge_key, 'From $' || (price_min_cents/100)::int
from public.featured_destinations
on conflict do nothing;

insert into public.featured_destination_translations (destination_id, locale, name, badge, price_label)
select id, 'fr',
  case when city='New York' then 'New York, États-Unis' else city || ', ' || country end,
  badge_key,
  'À partir de $' || (price_min_cents/100)::int
from public.featured_destinations
on conflict do nothing;

insert into public.featured_destination_translations (destination_id, locale, name, badge, price_label)
select id, 'es', city || ', ' || country, badge_key, 'Desde $' || (price_min_cents/100)::int
from public.featured_destinations
on conflict do nothing;

