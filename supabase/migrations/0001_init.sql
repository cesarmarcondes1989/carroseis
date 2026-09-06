-- CarrosseisIA · schema inicial
-- Rode com: supabase db push  (ou cole no SQL Editor do painel do Supabase)

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'admin');
create type public.plan_id as enum ('free', 'weekly', 'creator', 'pro', 'agency');
create type public.carousel_status as enum ('draft', 'generating', 'rendering', 'ready', 'error');
create type public.carousel_source as enum ('topic', 'url', 'youtube', 'pdf', 'script', 'mcp');
create type public.cover_mode as enum ('ai', 'own', 'none');
create type public.credit_kind as enum ('signup_bonus', 'purchase', 'carousel', 'ai_cover', 'admin_adjust', 'refund', 'bonus');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'refunded');

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  credits integer not null default 0 check (credits >= 0),
  unlimited_credits boolean not null default false,
  plan public.plan_id not null default 'free',
  plan_expires_at timestamptz,
  locale text not null default 'pt-BR',
  instagram_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ledger de créditos
-- ---------------------------------------------------------------------------
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  kind public.credit_kind not null,
  description text,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index credit_transactions_user_idx on public.credit_transactions(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Templates (catálogo, gerenciado pelo admin)
-- ---------------------------------------------------------------------------
create table public.templates (
  id text primary key,
  name text not null,
  description text not null,
  description_en text,
  category text not null,
  layout text not null,
  palette jsonb not null,
  fonts jsonb not null,
  supports_ai_cover boolean not null default true,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Modelos salvos (identidade visual do usuário)
-- ---------------------------------------------------------------------------
create table public.brand_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  template_id text references public.templates(id),
  palette jsonb,
  font_display text,
  font_body text,
  text_scale numeric(3,2) not null default 1.00,
  instagram_handle text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brand_models_user_idx on public.brand_models(user_id);
create unique index brand_models_one_default_idx on public.brand_models(user_id) where is_default;

-- ---------------------------------------------------------------------------
-- Carrosséis
-- ---------------------------------------------------------------------------
create table public.carousels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Sem título',
  template_id text not null references public.templates(id),
  brand_model_id uuid references public.brand_models(id) on delete set null,
  aspect text not null default '4:5' check (aspect in ('4:5', '1:1')),
  status public.carousel_status not null default 'draft',
  source public.carousel_source not null default 'topic',
  source_input text,
  slides jsonb not null default '[]'::jsonb,
  caption text,
  hashtags text[],
  cover_mode public.cover_mode not null default 'none',
  cover_scene text,
  cover_image_path text,
  cover_ai_charged boolean not null default false,
  brand_overrides jsonb,
  instagram_handle text,
  renders jsonb not null default '[]'::jsonb,
  credits_spent integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index carousels_user_idx on public.carousels(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Chaves de API (MCP)
-- ---------------------------------------------------------------------------
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Claude',
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  calls integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index api_keys_user_idx on public.api_keys(user_id);

-- ---------------------------------------------------------------------------
-- Planos e pagamentos
-- ---------------------------------------------------------------------------
create table public.plans (
  id public.plan_id primary key,
  name text not null,
  price_cents integer not null,
  credits integer not null,
  period_days integer not null,
  highlight boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id public.plan_id not null references public.plans(id),
  provider text not null default 'mercadopago',
  provider_payment_id text,
  preference_id text,
  amount_cents integer not null,
  status public.payment_status not null default 'pending',
  credits_granted integer not null default 0,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments(user_id, created_at desc);
create unique index payments_provider_idx on public.payments(provider, provider_payment_id) where provider_payment_id is not null;

-- ---------------------------------------------------------------------------
-- Eventos de uso (analytics do admin)
-- ---------------------------------------------------------------------------
create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index usage_events_created_idx on public.usage_events(created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger brand_models_updated before update on public.brand_models for each row execute function public.set_updated_at();
create trigger carousels_updated before update on public.carousels for each row execute function public.set_updated_at();
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Emails que nascem admin + saldo ilimitado (conta de testes)
create or replace function public.admin_emails() returns text[] language sql immutable as $$
  select array['contato@cesar-marcondes.com']
$$;

-- Cria o perfil quando um usuário entra (email/senha ou Google)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_admin boolean := lower(new.email) = any (public.admin_emails());
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, unlimited_credits, credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    case when v_admin then 'admin'::public.user_role else 'user' end,
    v_admin,
    30
  )
  on conflict (id) do nothing;

  insert into public.credit_transactions (user_id, amount, balance_after, kind, description)
  values (new.id, 30, 30, 'signup_bonus', 'Boas-vindas: 30 créditos');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Desconta créditos de forma atômica. Retorna o saldo após a operação.
create or replace function public.consume_credits(
  p_user uuid, p_amount integer, p_kind public.credit_kind, p_description text default null, p_reference uuid default null
) returns integer language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles%rowtype;
  v_new integer;
begin
  if p_amount < 0 then raise exception 'INVALID_AMOUNT'; end if;
  select * into v_profile from public.profiles where id = p_user for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  if v_profile.unlimited_credits then
    insert into public.credit_transactions (user_id, amount, balance_after, kind, description, reference_id)
    values (p_user, 0, v_profile.credits, p_kind, coalesce(p_description, '') || ' (ilimitado)', p_reference);
    return v_profile.credits;
  end if;
  if v_profile.credits < p_amount then raise exception 'INSUFFICIENT_CREDITS'; end if;
  v_new := v_profile.credits - p_amount;
  update public.profiles set credits = v_new where id = p_user;
  insert into public.credit_transactions (user_id, amount, balance_after, kind, description, reference_id)
  values (p_user, -p_amount, v_new, p_kind, p_description, p_reference);
  return v_new;
end $$;

-- Adiciona créditos (compra, bônus, ajuste do admin). Retorna o saldo novo.
create or replace function public.grant_credits(
  p_user uuid, p_amount integer, p_kind public.credit_kind, p_description text default null, p_reference uuid default null, p_by uuid default null
) returns integer language plpgsql security definer set search_path = public as $$
declare v_new integer;
begin
  update public.profiles set credits = greatest(0, credits + p_amount) where id = p_user returning credits into v_new;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  insert into public.credit_transactions (user_id, amount, balance_after, kind, description, reference_id, created_by)
  values (p_user, p_amount, v_new, p_kind, p_description, p_reference, p_by);
  return v_new;
end $$;

-- Aplica um plano comprado: estende validade e credita
create or replace function public.apply_plan(p_user uuid, p_plan public.plan_id, p_payment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_plan public.plans%rowtype; v_base timestamptz;
begin
  select * into v_plan from public.plans where id = p_plan;
  if not found then raise exception 'PLAN_NOT_FOUND'; end if;
  select greatest(coalesce(plan_expires_at, now()), now()) into v_base from public.profiles where id = p_user;
  update public.profiles set plan = p_plan, plan_expires_at = v_base + make_interval(days => v_plan.period_days) where id = p_user;
  perform public.grant_credits(p_user, v_plan.credits, 'purchase', 'Plano ' || v_plan.name, p_payment);
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.templates enable row level security;
alter table public.brand_models enable row level security;
alter table public.carousels enable row level security;
alter table public.api_keys enable row level security;
alter table public.plans enable row level security;
alter table public.payments enable row level security;
alter table public.usage_events enable row level security;

create policy "profiles: own or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: own update" on public.profiles for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and credits = (select p.credits from public.profiles p where p.id = auth.uid())
    and unlimited_credits = (select p.unlimited_credits from public.profiles p where p.id = auth.uid())
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
  );
create policy "profiles: admin update" on public.profiles for update using (public.is_admin());

create policy "credits: own or admin read" on public.credit_transactions for select using (user_id = auth.uid() or public.is_admin());

create policy "templates: public read" on public.templates for select using (active or public.is_admin());
create policy "templates: admin write" on public.templates for all using (public.is_admin());

create policy "brand_models: own" on public.brand_models for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "brand_models: admin read" on public.brand_models for select using (public.is_admin());

create policy "carousels: own" on public.carousels for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "carousels: admin read" on public.carousels for select using (public.is_admin());

create policy "api_keys: own read" on public.api_keys for select using (user_id = auth.uid() or public.is_admin());
create policy "api_keys: own update" on public.api_keys for update using (user_id = auth.uid());
create policy "api_keys: own delete" on public.api_keys for delete using (user_id = auth.uid());

create policy "plans: public read" on public.plans for select using (active or public.is_admin());
create policy "plans: admin write" on public.plans for all using (public.is_admin());

create policy "payments: own or admin read" on public.payments for select using (user_id = auth.uid() or public.is_admin());
create policy "usage: admin read" on public.usage_events for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('carousels', 'carousels', true, 26214400, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "storage: public read carousels" on storage.objects for select using (bucket_id = 'carousels');
create policy "storage: own folder write" on storage.objects for insert to authenticated
  with check (bucket_id = 'carousels' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: own folder update" on storage.objects for update to authenticated
  using (bucket_id = 'carousels' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'carousels' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Seed: planos (copiados do mercado, ajuste no painel admin)
-- ---------------------------------------------------------------------------
insert into public.plans (id, name, price_cents, credits, period_days, highlight, sort_order) values
  ('free',    'Grátis',   0,     30,   0,  false, 0),
  ('weekly',  'Semanal',  990,   40,   7,  false, 10),
  ('creator', 'Creator',  2990,  200,  30, true,  20),
  ('pro',     'Pro',      5990,  420,  30, false, 30),
  ('agency',  'Agência',  14990, 1320, 30, false, 40);

-- ---------------------------------------------------------------------------
-- Seed: templates (21, espelhando o catálogo do mercado)
-- ---------------------------------------------------------------------------
insert into public.templates (id, name, description, description_en, category, layout, palette, fonts, supports_ai_cover, sort_order) values
  ('post-social', 'Post / Rede Social', 'Frase de impacto, opinião, print de rede social. 100% tipográfico, sem capa por IA, sai mais barato. Aceita o nome do perfil.', 'Punchy quote, opinion, social-post screenshot. Typography only, no AI cover, cheaper.', 'geral', 'social', '{"bg":"#0b0b0f","fg":"#ffffff","accent":"#1d9bf0","muted":"#8b98a5","accent2":"#16181c"}', '{"display":"Inter","body":"Inter"}', false, 1),
  ('insider', 'Insider', 'Bastidor, método, ''como eu faço''. Visual editorial premium, título em caixa alta. Escolha fundo preto ou branco.', 'Behind the scenes, method, how-I-do-it. Premium editorial look, uppercase titles.', 'geral', 'insider', '{"bg":"#0a0a0a","fg":"#f5f5f4","accent":"#d4ff3f","muted":"#a3a3a3","accent2":"#171717"}', '{"display":"Bebas Neue","body":"Space Grotesk"}', true, 2),
  ('essencial', 'Essencial', 'Autoridade e marca pessoal: a capa leva a identidade do perfil (foto, nome e selo) por cima da foto, com a manchete grande embaixo.', 'Authority and personal brand: the cover carries your profile identity over the photo, headline below.', 'geral', 'identity', '{"bg":"#101014","fg":"#ffffff","accent":"#f5c518","muted":"#b3b3b3","accent2":"#1c1c22"}', '{"display":"Montserrat","body":"Inter"}', true, 3),
  ('full-texto', 'Full Texto', 'Texto grande em fundo colorido, sem imagem: regras, princípios, passo a passo, opinião, thread. Cada card troca a cor de fundo dentro da paleta.', 'Big text on colored background, no image: rules, principles, step by step, thread. Each card rotates the palette.', 'geral', 'fulltext', '{"bg":"#7c3aed","fg":"#ffffff","accent":"#facc15","muted":"#e9d5ff","accent2":"#db2777","cycle":["#7c3aed","#db2777","#0ea5e9","#16a34a","#f97316"]}', '{"display":"Archivo Black","body":"Inter"}', false, 4),
  ('advocacia', 'Advocacia', 'Direito, escritório de advocacia, direitos do trabalhador, contratos.', 'Law firms, workers'' rights, contracts.', 'nicho', 'niche', '{"bg":"#0f172a","fg":"#f8fafc","accent":"#c9a227","muted":"#94a3b8","accent2":"#1e293b"}', '{"display":"Playfair Display","body":"Inter"}', true, 10),
  ('noticias-virais', 'Notícias Virais', 'Notícia quente, polêmica, algo que ''parou a internet''. Palavras entre **asteriscos** no título ganham bloco de cor atrás.', 'Hot news, controversy, something that broke the internet. **Words** in asterisks get a color block.', 'noticias', 'news', '{"bg":"#000000","fg":"#ffffff","accent":"#ff1744","muted":"#bdbdbd","accent2":"#111111"}', '{"display":"Anton","body":"Inter"}', true, 11),
  ('marketing', 'Marketing', 'Marketing digital, tráfego pago, copy, oferta, funil.', 'Digital marketing, paid traffic, copy, offers, funnels.', 'nicho', 'niche', '{"bg":"#09090b","fg":"#fafafa","accent":"#a3e635","muted":"#a1a1aa","accent2":"#18181b"}', '{"display":"Space Grotesk","body":"Inter"}', true, 12),
  ('ia', 'Inteligência Artificial', 'Inteligência artificial, automação, ferramentas de IA. Palavras entre **asteriscos** no título ganham bloco de cor.', 'AI, automation, AI tools. **Words** in asterisks get a color block.', 'nicho', 'news', '{"bg":"#050510","fg":"#f1f5f9","accent":"#22d3ee","muted":"#94a3b8","accent2":"#7c3aed"}', '{"display":"Space Grotesk","body":"Inter"}', true, 13),
  ('imobiliaria', 'Imobiliária', 'Imóveis, financiamento, corretor, primeiro apartamento.', 'Real estate, financing, brokers, first apartment.', 'nicho', 'niche', '{"bg":"#f8f5f0","fg":"#1c1917","accent":"#b45309","muted":"#78716c","accent2":"#ffffff"}', '{"display":"Playfair Display","body":"Inter"}', true, 14),
  ('nutricionista', 'Nutricionista', 'Nutrição, alimentação, emagrecimento, receitas saudáveis.', 'Nutrition, food, weight loss, healthy recipes.', 'nicho', 'niche', '{"bg":"#f0fdf4","fg":"#14532d","accent":"#16a34a","muted":"#4d7c5c","accent2":"#ffffff"}', '{"display":"Poppins","body":"Poppins"}', true, 15),
  ('medicos', 'Médicos / Hospitalar', 'Medicina, clínica médica, prevenção, orientação de saúde.', 'Medicine, clinics, prevention, health guidance.', 'nicho', 'niche', '{"bg":"#f0f9ff","fg":"#0c4a6e","accent":"#0284c7","muted":"#527a94","accent2":"#ffffff"}', '{"display":"Montserrat","body":"Inter"}', true, 16),
  ('educacao', 'Educação / Professores', 'Ensino, professores, concursos, técnicas de estudo.', 'Teaching, teachers, exams, study techniques.', 'nicho', 'niche', '{"bg":"#fffbeb","fg":"#1f2937","accent":"#f59e0b","muted":"#6b7280","accent2":"#ffffff"}', '{"display":"Poppins","body":"Inter"}', true, 17),
  ('clinica-estetica', 'Clínica de Estética', 'Harmonização facial, procedimentos estéticos, clínica de estética.', 'Facial harmonization, aesthetic procedures.', 'nicho', 'niche', '{"bg":"#fdf2f8","fg":"#3b0a2a","accent":"#c2185b","muted":"#8a5470","accent2":"#ffffff"}', '{"display":"Playfair Display","body":"Poppins"}', true, 18),
  ('contabilidade', 'Contabilidade e Financeiro', 'Contabilidade, imposto de renda, MEI, finanças de empresa.', 'Accounting, income tax, small business, company finance.', 'nicho', 'niche', '{"bg":"#0b1220","fg":"#e2e8f0","accent":"#34d399","muted":"#94a3b8","accent2":"#111c33"}', '{"display":"Montserrat","body":"Inter"}', true, 19),
  ('academia', 'Academia / Fitness', 'Treino, academia, personal trainer, hipertrofia.', 'Training, gym, personal trainer, hypertrophy.', 'nicho', 'niche', '{"bg":"#0a0a0a","fg":"#ffffff","accent":"#ff5722","muted":"#9e9e9e","accent2":"#1a1a1a"}', '{"display":"Bebas Neue","body":"Inter"}', true, 20),
  ('turismo', 'Turismo', 'Viagem, destinos, agência de turismo, roteiros.', 'Travel, destinations, agencies, itineraries.', 'nicho', 'niche', '{"bg":"#0c4a6e","fg":"#ffffff","accent":"#fbbf24","muted":"#bae6fd","accent2":"#075985"}', '{"display":"Montserrat","body":"Inter"}', true, 21),
  ('beleza', 'Beleza e Estética', 'Cabelo, maquiagem, salão, cuidados com a pele.', 'Hair, makeup, salons, skincare.', 'nicho', 'niche', '{"bg":"#1a0f14","fg":"#fff1f2","accent":"#fb7185","muted":"#d4a5b0","accent2":"#2a1820"}', '{"display":"Playfair Display","body":"Inter"}', true, 22),
  ('categoria', 'Notícias', 'Notícia factual e séria, jornalismo, cobertura de acontecimento.', 'Factual, serious news, journalism, event coverage.', 'noticias', 'news', '{"bg":"#ffffff","fg":"#111111","accent":"#c62828","muted":"#616161","accent2":"#f5f5f5"}', '{"display":"Playfair Display","body":"Inter"}', true, 23),
  ('dentistas', 'Dentistas', 'Odontologia, implante, ortodontia, clareamento.', 'Dentistry, implants, orthodontics, whitening.', 'nicho', 'niche', '{"bg":"#ecfeff","fg":"#164e63","accent":"#06b6d4","muted":"#5b8a96","accent2":"#ffffff"}', '{"display":"Poppins","body":"Inter"}', true, 24),
  ('joias', 'Joias e Semijoias', 'Joias, semijoias, relógios, produto de luxo.', 'Jewelry, watches, luxury products.', 'nicho', 'niche', '{"bg":"#0c0a09","fg":"#fafaf9","accent":"#d4af37","muted":"#a8a29e","accent2":"#1c1917"}', '{"display":"DM Serif Display","body":"Inter"}', true, 25),
  ('pets', 'Pets', 'Cães, gatos, pet shop, veterinária, adestramento.', 'Dogs, cats, pet shops, vets, training.', 'nicho', 'niche', '{"bg":"#fff7ed","fg":"#431407","accent":"#ea580c","muted":"#9a6a4f","accent2":"#ffffff"}', '{"display":"Poppins","body":"Poppins"}', true, 26);

-- ---------------------------------------------------------------------------
-- Seed: conta admin de testes (saldo ilimitado)
-- Email: contato@cesar-marcondes.com
-- A senha inicial é lida da variável de sessão app.seed_password. Rode ANTES desta migration:
--   set app.seed_password = 'sua-senha-forte';
-- Se a variável não existir, o usuário é criado sem senha: entre com Google ou use
-- "Esqueci minha senha" no login. Login com Google no mesmo email cai no mesmo perfil.
-- ---------------------------------------------------------------------------
do $$
declare
  v_id uuid := gen_random_uuid();
  v_pwd text := nullif(current_setting('app.seed_password', true), '');
begin
  if not exists (select 1 from auth.users where lower(email) = 'contato@cesar-marcondes.com') then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_super_admin)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'contato@cesar-marcondes.com',
      case when v_pwd is null then null else extensions.crypt(v_pwd, extensions.gen_salt('bf')) end, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Cesar Marcondes"}', now(), now(), '', '', '', '', false);
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', 'contato@cesar-marcondes.com', 'email_verified', true), 'email', now(), now(), now());
  end if;
  update public.profiles set role = 'admin', unlimited_credits = true, plan = 'agency', plan_expires_at = now() + interval '100 years'
  where lower(email) = 'contato@cesar-marcondes.com';
end $$;
