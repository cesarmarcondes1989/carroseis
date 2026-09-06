-- CarrosseisIA · templates por camadas (editor do plano Agência)

create table if not exists public.user_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  base_template_id text not null references public.templates(id) default 'marketing',
  palette jsonb not null,
  fonts jsonb not null,
  layers jsonb not null,
  supports_ai_cover boolean not null default true,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_templates_user_idx on public.user_templates(user_id, updated_at desc);
create trigger user_templates_updated before update on public.user_templates for each row execute function public.set_updated_at();

alter table public.user_templates enable row level security;
create policy "user_templates: own" on public.user_templates for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_templates: admin read" on public.user_templates for select using (public.is_admin());

-- Carrossel pode apontar pra um template do usuário; se ele for apagado, cai no template base
alter table public.carousels add column if not exists user_template_id uuid references public.user_templates(id) on delete set null;
alter table public.brand_models add column if not exists user_template_id uuid references public.user_templates(id) on delete set null;
