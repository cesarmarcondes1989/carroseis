-- CarrosseisIA · fundo contínuo (carrossel panorâmico)
alter table public.carousels add column if not exists seamless boolean not null default false;
