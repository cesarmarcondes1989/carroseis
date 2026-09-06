-- CarrosseisIA · onboarding em 3 perguntas
alter table public.profiles
  add column if not exists onboarded_at timestamptz,
  add column if not exists onboarding jsonb;

-- Quem já existia não precisa passar pelo onboarding
update public.profiles set onboarded_at = now() where onboarded_at is null and created_at < now() - interval '1 hour';
