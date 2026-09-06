-- CarrosseisIA · painel admin: dona da conta, banimento, auditoria e estatísticas

-- ---------------------------------------------------------------------------
-- Perfis: atividade e banimento
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists last_active_at timestamptz,
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_reason text,
  add column if not exists admin_notes text;

create index if not exists profiles_created_idx on public.profiles(created_at desc);
create index if not exists profiles_last_active_idx on public.profiles(last_active_at desc);

-- ---------------------------------------------------------------------------
-- Dona da conta: quem está em admin_emails() não pode ser excluída, rebaixada,
-- perder o ilimitado nem ser banida, por nenhum caminho (API, SQL, cascade).
-- ---------------------------------------------------------------------------
create or replace function public.is_owner_email(p_email text) returns boolean language sql immutable as $$
  select lower(coalesce(p_email, '')) = any (public.admin_emails())
$$;

create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public.is_owner_email(email) from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.protect_owner() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if public.is_owner_email(old.email) then
      raise exception 'OWNER_PROTECTED: a conta dona não pode ser excluída';
    end if;
    return old;
  end if;
  if public.is_owner_email(old.email) then
    new.email := old.email;
    new.role := 'admin';
    new.unlimited_credits := true;
    new.is_banned := false;
    new.banned_reason := null;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_owner on public.profiles;
create trigger profiles_protect_owner before update or delete on public.profiles
  for each row execute function public.protect_owner();

-- A exclusão em auth.users cascateia para profiles; o trigger acima derruba a transação.
create or replace function public.protect_owner_auth() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_owner_email(old.email) then
    raise exception 'OWNER_PROTECTED: a conta dona não pode ser excluída';
  end if;
  return old;
end $$;

drop trigger if exists auth_users_protect_owner on auth.users;
create trigger auth_users_protect_owner before delete on auth.users
  for each row execute function public.protect_owner_auth();

-- ---------------------------------------------------------------------------
-- Auditoria de ações administrativas
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  target_id uuid,
  target_email text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit(created_at desc);
create index if not exists admin_audit_target_idx on public.admin_audit(target_id);

alter table public.admin_audit enable row level security;
create policy "audit: admin read" on public.admin_audit for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Estatísticas agregadas (chamada só pelo servidor com service_role)
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats(p_days integer default 30) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_from timestamptz := date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1);
  v_7d timestamptz := now() - interval '7 days';
  v_14d timestamptz := now() - interval '14 days';
  v_daily jsonb;
  v_totals jsonb;
  v_breakdowns jsonb;
  v_top_users jsonb;
begin
  with days as (
    select generate_series(v_from, date_trunc('day', now()), interval '1 day')::date as d
  ),
  s as (select created_at::date d, count(*) n from public.profiles where created_at >= v_from group by 1),
  c as (select created_at::date d, count(*) n, count(*) filter (where source = 'mcp') mcp, count(*) filter (where cover_ai_charged) ai_cover from public.carousels where created_at >= v_from group by 1),
  k as (select created_at::date d, sum(-amount) n from public.credit_transactions where created_at >= v_from and amount < 0 group by 1),
  p as (select created_at::date d, sum(amount_cents) n, count(*) q from public.payments where created_at >= v_from and status = 'approved' group by 1),
  u as (select created_at::date d, count(distinct user_id) n from public.usage_events where created_at >= v_from group by 1)
  select jsonb_agg(jsonb_build_object(
    'date', days.d,
    'signups', coalesce(s.n, 0),
    'carousels', coalesce(c.n, 0),
    'mcp', coalesce(c.mcp, 0),
    'ai_covers', coalesce(c.ai_cover, 0),
    'credits', coalesce(k.n, 0),
    'revenue_cents', coalesce(p.n, 0),
    'payments', coalesce(p.q, 0),
    'active_users', coalesce(u.n, 0)
  ) order by days.d) into v_daily
  from days
  left join s on s.d = days.d
  left join c on c.d = days.d
  left join k on k.d = days.d
  left join p on p.d = days.d
  left join u on u.d = days.d;

  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_7d', (select count(*) from public.profiles where created_at >= v_7d),
    'users_prev_7d', (select count(*) from public.profiles where created_at >= v_14d and created_at < v_7d),
    'admins', (select count(*) from public.profiles where role = 'admin'),
    'banned', (select count(*) from public.profiles where is_banned),
    'paying', (select count(*) from public.profiles where plan <> 'free' and plan_expires_at > now() and not unlimited_credits),
    'carousels', (select count(*) from public.carousels),
    'carousels_7d', (select count(*) from public.carousels where created_at >= v_7d),
    'carousels_prev_7d', (select count(*) from public.carousels where created_at >= v_14d and created_at < v_7d),
    'carousels_ready', (select count(*) from public.carousels where status = 'ready'),
    'carousels_error', (select count(*) from public.carousels where status = 'error'),
    'revenue_cents', (select coalesce(sum(amount_cents), 0) from public.payments where status = 'approved'),
    'revenue_30d_cents', (select coalesce(sum(amount_cents), 0) from public.payments where status = 'approved' and created_at >= now() - interval '30 days'),
    'revenue_prev_30d_cents', (select coalesce(sum(amount_cents), 0) from public.payments where status = 'approved' and created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'),
    'payments_pending', (select count(*) from public.payments where status = 'pending'),
    'credits_circulating', (select coalesce(sum(credits), 0) from public.profiles where not unlimited_credits),
    'credits_consumed_7d', (select coalesce(sum(-amount), 0) from public.credit_transactions where amount < 0 and created_at >= v_7d),
    'ai_covers_total', (select count(*) from public.carousels where cover_ai_charged),
    'api_keys_active', (select count(*) from public.api_keys where revoked_at is null),
    'mcp_calls', (select coalesce(sum(calls), 0) from public.api_keys),
    'active_7d', (select count(distinct user_id) from public.usage_events where created_at >= v_7d),
    'active_30d', (select count(distinct user_id) from public.usage_events where created_at >= now() - interval '30 days'),
    'downloads_7d', (select count(*) from public.usage_events where event = 'carousel.download' and created_at >= v_7d)
  ) into v_totals;

  select jsonb_build_object(
    'templates', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'count', x.n) order by x.n desc), '[]'::jsonb)
                  from (select template_id, count(*) n from public.carousels group by 1) x join public.templates t on t.id = x.template_id),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', source, 'count', n) order by n desc), '[]'::jsonb)
                from (select source, count(*) n from public.carousels group by 1) x),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object('plan', plan, 'count', n) order by n desc), '[]'::jsonb)
              from (select case when plan <> 'free' and plan_expires_at > now() then plan::text else 'free' end plan, count(*) n from public.profiles group by 1) x),
    'covers', (select coalesce(jsonb_agg(jsonb_build_object('mode', cover_mode, 'count', n) order by n desc), '[]'::jsonb)
               from (select cover_mode, count(*) n from public.carousels group by 1) x),
    'statuses', (select coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', n) order by n desc), '[]'::jsonb)
                 from (select status, count(*) n from public.carousels group by 1) x)
  ) into v_breakdowns;

  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'email', p.email, 'full_name', p.full_name, 'plan', p.plan, 'credits', p.credits, 'unlimited', p.unlimited_credits, 'carousels', x.n, 'spent', x.spent) order by x.n desc), '[]'::jsonb)
  into v_top_users
  from (select user_id, count(*) n, sum(credits_spent) spent from public.carousels where created_at >= now() - interval '30 days' group by 1 order by 2 desc limit 10) x
  join public.profiles p on p.id = x.user_id;

  return jsonb_build_object('daily', v_daily, 'totals', v_totals, 'breakdowns', v_breakdowns, 'top_users', v_top_users, 'generated_at', now());
end $$;

revoke all on function public.admin_stats(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Consumo por usuário (usado na página de detalhe)
-- ---------------------------------------------------------------------------
create or replace function public.admin_user_summary(p_user uuid) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'carousels', (select count(*) from public.carousels where user_id = p_user),
    'carousels_ready', (select count(*) from public.carousels where user_id = p_user and status = 'ready'),
    'credits_spent', (select coalesce(sum(-amount), 0) from public.credit_transactions where user_id = p_user and amount < 0),
    'credits_bought', (select coalesce(sum(amount), 0) from public.credit_transactions where user_id = p_user and kind = 'purchase'),
    'revenue_cents', (select coalesce(sum(amount_cents), 0) from public.payments where user_id = p_user and status = 'approved'),
    'downloads', (select count(*) from public.usage_events where user_id = p_user and event = 'carousel.download'),
    'mcp_calls', (select coalesce(sum(calls), 0) from public.api_keys where user_id = p_user),
    'last_event', (select max(created_at) from public.usage_events where user_id = p_user)
  )
$$;
revoke all on function public.admin_user_summary(uuid) from public, anon, authenticated;

-- Garante que a dona já esteja marcada como admin/ilimitada (idempotente)
update public.profiles set role = 'admin', unlimited_credits = true where public.is_owner_email(email);
