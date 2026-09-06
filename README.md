# Desliza IA

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

## Onboarding e download no celular

Rode `supabase/migrations/0003_onboarding.sql`. Conta nova cai em `/app/comecar`: 3 perguntas (nicho, objetivo, tom) e @ opcional, pulável. A IA escolhe o template e propõe 3 temas com botão "Criar esse" que já abre o criador preenchido. Quem já tinha conta não passa por isso.

No estúdio, os cards prontos aparecem num painel de download: no celular, "Salvar no celular" usa a Web Share API e abre a folha nativa (Salvar imagens, ou mandar direto pro Instagram, que monta o carrossel na ordem); também dá pra salvar card por card. No desktop, download individual ou ZIP. Cada card é servido por `/api/carousels/[id]/slide/[n]` no mesmo domínio (exige plano, igual ao ZIP).

## Fundo contínuo (carrossel infinito)

Rode `supabase/migrations/0004_seamless.sql`. Com a opção ligada (criador, estúdio ou `fundo_continuo` no MCP), o renderizador pinta um panorama de largura `1080 × cards` e cada card mostra a sua fatia: gradiente, formas, título fantasma e a foto de capa atravessam as bordas. Capa por IA nesse modo sai em paisagem (1536×1024). Pra conferir a continuidade localmente: `npx tsx scripts/strip.ts <template> 4x5` monta os cards lado a lado.

## Editor de templates (plano Agência)

Rode `supabase/migrations/0005_user_templates.sql`. Quem tem plano **Agência** (ou conta ilimitada/admin) ganha `/app/templates`: um editor estilo Canva onde o slide é montado por **camadas** (texto, forma, etiqueta, imagem, paginação) num canvas de 1080×1350, separadas por papel (capa, miolo, última). Dá pra arrastar e redimensionar direto no stage, com imãs nas bordas, margem segura, centro e outras camadas; undo/redo; atalhos (setas, Ctrl+Z/Y, Ctrl+D, Delete); paleta e fontes próprias; upload de imagem. No celular a prancha fica em cima, com alças maiores pro toque, e camadas, propriedades, paleta e agente viram abas embaixo. Pontos de partida: folha em branco ou presets (nicho, insider, texto corrido, notícia). Templates salvos aparecem como "Meus templates" no criador, no estúdio e no `listar_templates` do MCP (id `user:<uuid>`), e o carrossel guarda `user_template_id` mantendo o template base como fallback.

Textos das camadas aceitam `{titulo}`, `{texto}`, `{etiqueta}`, `{handle}`, `{index}`, `{total}` e `{n}`; cores aceitam tokens da paleta (`bg`, `fg`, `accent`, `muted`, `accent2`, `auto`), `token@alpha`, hex ou string de gradiente.

A aba **Agente** manda uma instrução em linguagem natural (ex.: "capa mais ousada, título maior e etiqueta no canto") pro designer de IA (`designAgent` no provider, modelo `OPENAI_DESIGN_MODEL` ou o de texto); a resposta é validada com zod antes de entrar no editor e pode ser desfeita. Pra conferir os presets localmente através do Satori: `npx tsx scripts/layers-test.ts` gera PNGs em `/tmp/layers`.

## Marca Desliza IA

Paleta: fundo `#0B0B0F`, violeta `#7C3AED` (inovação), ciano `#22D3EE` (tecnologia), lima `#A3E635` (energia), texto `#F8FAFC`. Fontes: Sora (títulos) e Inter (texto), servidas de `public/fonts` (Sora em woff, do fontsource). O símbolo é o chevron duplo com o gradiente violeta → ciano → lima (`BrandMark` em `components/ui.tsx`, favicon em `app/icon.svg`). Utilitários CSS: `.brand-gradient`, `.text-gradient`, `.underline-brand`.

Template da casa `desliza` (rode `supabase/migrations/0007_desliza.sql` pra ele existir no banco, já que carrosséis apontam pro template por chave estrangeira): foto em fade pro preto, número do card, manchete em Sora com a palavra entre **asteriscos** em lima (modo `highlightMode: "color"` das camadas), seta pra deslizar, CTA em violeta. As camadas ficam em `lib/layers/presets.ts` (`DESLIZA`) e também aparecem como preset no editor. `npx tsx scripts/desliza-test.ts` renderiza um exemplo. Templates por camadas recebem a foto de capa em todos os cards (cada camada decide se usa).

## Roteiro pra ser salvo e Score de Save

O prompt do roteirista segue o que faz carrossel ser salvo e enviado por DM (o que o Instagram mais pesa em 2026): capa até 8 palavras com número, pergunta ou promessa; uma ideia por card, até 20 palavras no card; texto de apoio em todo card do meio; último card pedindo explicitamente pra salvar e mandar pra alguém. `src/lib/score.ts` calcula um **Score de Save** de 0 a 100, determinístico e sem IA, com checklist do que falta; aparece no estúdio (`SaveScore`) e na resposta do MCP.

## Série de carrosséis

Rode `supabase/migrations/0006_series.sql`. Em `/app/serie` (ou `criar_serie` no MCP) a IA planeja de 2 a 7 episódios encadeados sobre um tema (`planSeries` no provider: nome da série, ângulo de cada episódio sem sobreposição, gancho pro próximo) e cria todos os carrosséis em paralelo, cada um com roteiro próprio que recebe o contexto da série (`seriesContext`). Custa carrossel + roteiro por episódio; o que falhar é estornado individualmente. Os carrosséis guardam `series_id`, `series_name`, `series_index` e `series_total` e aparecem agrupados em Meus projetos.

## Imagens dos cards

As imagens finais ficam salvas no Storage (bucket `carousels`) e no campo `renders` do carrossel, então não são geradas de novo a cada visita. O estúdio gera na primeira abertura sozinho; qualquer edição que muda a arte limpa `renders` e o botão vira "Regerar imagens".

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
