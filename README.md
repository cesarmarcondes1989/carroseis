# CarrosseisIA

Gerador de carrosséis para Instagram com IA. Você escolhe o template e diz o tema (ou cola um link, um vídeo do YouTube ou um PDF). A IA escreve o roteiro, o app pinta a arte e entrega os PNGs. Também funciona como **conector MCP** dentro do Claude.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase: Auth (email/senha + Google), Postgres com RLS, Storage
- IA: OpenAI (gpt-4o-mini para roteiro, gpt-image-1 para capa). Troca para Anthropic com `AI_PROVIDER=anthropic`
- Render dos PNGs: Satori + resvg (serverless, sem Chromium)
- Pagamentos: Mercado Pago Checkout Pro + webhook
- MCP: `@modelcontextprotocol/sdk`, Streamable HTTP, autenticado por chave API

## Subindo

1. **Supabase**: crie o projeto, habilite o provider Google em Authentication > Providers e rode a migration:
   ```bash
   supabase link --project-ref SEU_REF
   supabase db push
   ```
   Ou cole `supabase/migrations/0001_init.sql` no SQL Editor. Para a conta admin de testes nascer com senha, rode antes, na mesma sessão do SQL Editor:
   ```sql
   set app.seed_password = 'uma-senha-forte';
   ```
   Sem isso, a conta `contato@cesar-marcondes.com` nasce sem senha: entre com Google ou use "Esqueci minha senha".
   Em Authentication > URL Configuration, adicione `https://SEU-DOMINIO/auth/callback` nas Redirect URLs.
2. **Variáveis de ambiente**: copie `.env.example` para `.env.local` e preencha.
3. **Mercado Pago**: em Suas integrações, pegue o Access Token e cadastre o webhook `https://SEU-DOMINIO/api/webhooks/mercadopago` (evento Pagamentos). Copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
4. `npm install && npm run dev`

## Créditos

| Ação | Custo |
| --- | --- |
| Criar carrossel com roteiro próprio (app ou MCP) | 1 |
| Roteiro escrito pela IA | +2 |
| Capa gerada por IA | 10 (uma vez por carrossel) |
| Editar, trocar template, pintar, preview | 0 |
| Download dos PNGs | exige plano ativo |

Conta nova ganha 30 créditos. A conta admin (`contato@cesar-marcondes.com`) tem saldo ilimitado e acesso ao `/admin`.

## Painel admin (`/admin`)

Rode também `supabase/migrations/0002_admin.sql` (ou `supabase db push`). Ele cria auditoria, banimento, estatísticas agregadas e a proteção da **conta dona**.

- **Visão geral**: KPIs com tendência, gráficos de 7/30/90 dias (cadastros, ativos, carrosséis app vs MCP, créditos, receita), templates mais usados, origem do conteúdo, planos, feed em tempo real, novos usuários, top usuários e últimas ações admin.
- **Usuários**: busca, filtros (novos, pagantes, ativos, admins, banidos), página por usuário com ledger, carrosséis, chaves MCP, pagamentos e ações: ajustar créditos, plano, ilimitado, admin, banir, revogar chaves, excluir, notas internas.
- **Pagamentos**, **Atividade** (eventos + auditoria) e **Catálogo** (preços dos planos e templates ativos).
- **Admins**: só a conta dona promove ou rebaixa. Quem é dona vem de `OWNER_EMAILS` (env, padrão `contato@cesar-marcondes.com`) e de `admin_emails()` no banco. Triggers impedem excluir, rebaixar, banir ou tirar o ilimitado dela por qualquer caminho, inclusive SQL direto e cascade do `auth.users`.

## MCP no Claude

1. Em **Meu estúdio > Chave API / MCP**, gere uma chave.
2. No Claude.ai: Configurações > Conectores > Adicionar conector personalizado, URL `https://SEU-DOMINIO/api/mcp/<chave>`.
3. No Claude Code: `claude mcp add --transport http carrosseisia https://SEU-DOMINIO/api/mcp/<chave>`.

Ferramentas: `listar_templates`, `listar_modelos`, `meus_creditos`, `criar_carrossel`, `status_carrossel`.

## Teste local do render

```bash
npx tsx scripts/render-test.ts marketing insider
```
Gera PNGs em `/tmp/render-test`.
