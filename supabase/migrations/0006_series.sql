-- Séries: vários carrosséis encadeados sobre um tema, criados de uma vez.
alter table public.carousels
  add column if not exists series_id uuid,
  add column if not exists series_name text,
  add column if not exists series_index int,
  add column if not exists series_total int;

create index if not exists carousels_series_idx on public.carousels (series_id, series_index);
