import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TEMPLATE_IDS } from "@/lib/templates/registry";
import { CREDIT_COST, type Profile } from "@/lib/types";
import { adminClient } from "@/lib/supabase/admin";
import { InsufficientCredits, planActive } from "@/lib/credits";
import { appUrl, createCarousel, listBrandModels, listTemplates, renderCarousel } from "@/lib/carousel-service";

const INSTRUCTIONS = `O CarrosseisIA transforma um roteiro escrito em um carrossel pronto pro Instagram.

Fluxo: 1) chame listar_modelos e listar_templates; 2) escreva o roteiro; 3) PERGUNTE as duas coisas abaixo; 4) chame criar_carrossel; 5) entregue o link.

MODELO SALVO (padrão visual da pessoa: cores, fontes, tamanho do texto e @). Chame listar_modelos UMA VEZ no começo. Ele vale por cima de qualquer template: o template dá o layout, o modelo dá a identidade.
- Se existir um modelo PADRÃO, ele entra sozinho. Não pergunte cor, fonte nem tamanho, e não pergunte o @ se o modelo já tiver um.
- Se a pessoa citar um pelo nome, mande o nome em 'modelo'. Nunca invente nome de modelo.

SEMPRE pergunte antes de criar, numa mensagem só, e espere a resposta:
a) 'Quer colocar o seu @ do Instagram na arte? Se sim, qual é?' (parâmetro 'perfil'; pule se o modelo já trouxer o @)
b) 'A capa vai ser gerada por IA (custa ${CREDIT_COST.aiCover} créditos) ou você prefere usar uma foto sua (grátis, você sobe no app)?' IA = capa:'ia'. Foto = capa:'propria'. Só tipografia = capa:'nenhuma'.
c) Se escolher IA, pergunte 'Como você imagina essa capa? Me descreve a cena.' e mande em 'cena'. Se não souber, sugira 2 ou 3 cenas curtas.

Escreva sem travessão: use vírgula, ponto ou dois-pontos. Palavras entre **asteriscos** no título ganham bloco de cor nos templates de notícia e nicho (use 1 ou 2 por título).
Fotos não passam pelo chat: a pessoa sobe no link que você entregar.`;

export function buildMcpServer(profile: Profile) {
  const server = new McpServer({ name: "carrosseisia", version: "1.0.0" }, { instructions: INSTRUCTIONS });

  server.registerTool(
    "listar_templates",
    { description: "Lista os templates disponíveis (id, nome, pra que serve, se aceita capa por IA). Use o id no parâmetro 'template' de criar_carrossel.", inputSchema: {} },
    async () => {
      const list = await listTemplates();
      const text = [`Templates do CarrosseisIA (${list.length}):`, "", ...list.map((t) => `- ${t.id} (${t.name})${t.supports_ai_cover ? "" : " [sem capa por IA]"}: ${t.description}`), "", "Use o id da esquerda no parâmetro 'template' de criar_carrossel."].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  server.registerTool(
    "listar_modelos",
    { description: "Lista os modelos salvos da pessoa (identidade visual: cores, fonte, tamanho e @). Chame uma vez no começo da conversa.", inputSchema: {} },
    async () => {
      const models = await listBrandModels(profile.id);
      if (!models.length) {
        return { content: [{ type: "text", text: "Você ainda não tem nenhum modelo salvo, então o carrossel sai com as cores e os tamanhos do template.\n\nPra criar um: no app, abra qualquer carrossel, ajuste cor, fonte e tamanho e clique em 'Salvar este visual como modelo'. Marcando 'usar sempre', ele entra em todo carrossel novo, aqui e no app." }] };
      }
      const text = models
        .map((m) => `- ${m.name}${m.is_default ? " [PADRÃO, entra sozinho]" : ""}: template ${m.template_id ?? "livre"}, fonte ${m.font_display ?? "do template"}, tamanho x${Number(m.text_scale).toFixed(2)}${m.instagram_handle ? `, @${m.instagram_handle}` : ""}`)
        .join("\n");
      return { content: [{ type: "text", text: `Modelos salvos:\n${text}` }] };
    },
  );

  server.registerTool(
    "meus_creditos",
    { description: "Mostra o saldo de créditos e o plano da pessoa.", inputSchema: {} },
    async () => {
      const { data } = await adminClient().from("profiles").select("*").eq("id", profile.id).single();
      const p = (data as Profile) ?? profile;
      const saldo = p.unlimited_credits ? "ilimitado" : `${p.credits} créditos`;
      const plano = planActive(p) ? `Plano: ${p.plan}${p.plan_expires_at ? ` (até ${new Date(p.plan_expires_at).toLocaleDateString("pt-BR")})` : ""}.` : "Plano: trial, sem plano.";
      return { content: [{ type: "text", text: `Saldo: ${saldo}. ${plano}\nCriar um carrossel custa ${CREDIT_COST.carousel}. A capa por IA custa ${CREDIT_COST.aiCover} quando você gera no link.\nMontar e ver o carrossel é livre. O download pede um plano, a partir de R$9,90 por semana.` }] };
    },
  );

  server.registerTool(
    "criar_carrossel",
    {
      description: `Cria o carrossel a partir de um roteiro que VOCÊ escreveu e devolve o link onde a arte fica pronta pra baixar. Custa ${CREDIT_COST.carousel} crédito. ANTES de chamar, pergunte o @ do Instagram (opcional) e se a capa vai ser por IA (${CREDIT_COST.aiCover} créditos, cobrados quando a pessoa gerar no link) ou foto própria (grátis). Escreva sem travessão.`,
      inputSchema: {
        slides: z
          .array(
            z.object({
              titulo: z.string().describe("Título do card, curto e forte, até ~12 palavras"),
              texto: z.string().optional().describe("Texto de apoio, opcional"),
              etiqueta: z.string().optional().describe("Pílula no canto do card, opcional. Vazio = sem pílula"),
            }),
          )
          .min(2)
          .max(10)
          .describe("Os cards, em ordem. O primeiro é a capa, o último é a chamada pra ação."),
        template: z.enum(TEMPLATE_IDS as [string, ...string[]]).optional().describe("id do template (veja listar_templates). Só pode faltar quando o modelo aplicado já traz o template dele"),
        modelo: z.string().optional().describe("Nome do modelo salvo que a pessoa mandou seguir. Vazio = o modelo padrão dela entra sozinho. Nunca invente"),
        perfil: z.string().optional().describe("@ do Instagram, sem o arroba. Opcional, aparece nos cards"),
        capa: z.enum(["ia", "propria", "nenhuma"]).optional().describe("'ia' = capa por IA (cobrada quando gerar). 'propria' = a pessoa sobe a foto no app. 'nenhuma' = só texto. PERGUNTE antes"),
        cena: z.string().optional().describe("Descrição da cena da capa por IA, em português. Só com capa:'ia'"),
        aspecto: z.enum(["4:5", "1:1"]).optional().describe("Formato. Padrão 4:5 (o do feed)"),
        fundo_continuo: z.boolean().optional().describe("true = carrossel panorâmico: o fundo, as formas e a foto de capa atravessam todos os cards, quem arrasta vê a imagem continuar. Ofereça quando a pessoa pedir 'fundo infinito', 'contínuo' ou 'panorâmico'"),
        titulo: z.string().optional().describe("Nome do projeto em Meus Projetos. Opcional"),
      },
    },
    async (args) => {
      const models = await listBrandModels(profile.id);
      let model = args.modelo ? models.find((m) => m.name.toLowerCase() === args.modelo!.toLowerCase()) : models.find((m) => m.is_default);
      if (args.modelo && !model) {
        return { isError: true, content: [{ type: "text", text: `Não achei um modelo chamado '${args.modelo}'. Modelos existentes: ${models.map((m) => m.name).join(", ") || "nenhum"}.` }] };
      }
      const templateId = args.template ?? model?.template_id;
      if (!templateId) {
        model = undefined;
        return { isError: true, content: [{ type: "text", text: "Falta o template. Chame listar_templates e escolha um id." }] };
      }
      const coverMode = args.capa === "ia" ? "ai" : args.capa === "propria" ? "own" : "none";
      try {
        const created = await createCarousel({
          profile,
          templateId,
          source: "mcp",
          slides: args.slides,
          aspect: args.aspecto ?? "4:5",
          coverMode,
          coverScene: args.cena ?? null,
          handle: args.perfil ?? null,
          brandModel: model ?? null,
          title: args.titulo ?? args.slides[0].titulo,
          topic: args.slides[0].titulo,
          seamless: !!args.fundo_continuo,
        });
        const { data: fresh } = await adminClient().from("profiles").select("*").eq("id", profile.id).single();
        const rendered = await renderCarousel(created, (fresh as Profile) ?? profile);
        const link = appUrl(`/app/c/${rendered.id}`);
        const p = (fresh as Profile) ?? profile;
        const saldo = p.unlimited_credits ? "ilimitado" : String(p.credits);
        const lines = [
          `Carrossel criado: ${rendered.title} (${rendered.slides.length} cards, template ${templateId}${model ? `, modelo ${model.name}` : ""}).`,
          `Link pra ver, ajustar e baixar: ${link}`,
          coverMode === "ai" ? `A capa por IA será gerada quando a pessoa abrir o link e clicar em 'Gerar capa' (${CREDIT_COST.aiCover} créditos).` : coverMode === "own" ? "A pessoa sobe a foto da capa no link." : "",
          `Saldo: ${saldo} créditos.`,
        ].filter(Boolean);
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (e) {
        if (e instanceof InsufficientCredits) {
          return { isError: true, content: [{ type: "text", text: `Créditos insuficientes. Compre um plano em ${appUrl("/app/creditos")}.` }] };
        }
        return { isError: true, content: [{ type: "text", text: `Erro ao criar: ${e instanceof Error ? e.message : String(e)}` }] };
      }
    },
  );

  server.registerTool(
    "status_carrossel",
    { description: "Consulta o status de um carrossel criado (pronto, pintando, erro) e devolve os links das imagens.", inputSchema: { id: z.string().describe("id do carrossel") } },
    async ({ id }) => {
      const { data } = await adminClient().from("carousels").select("id, title, status, renders, error").eq("id", id).eq("user_id", profile.id).maybeSingle();
      if (!data) return { isError: true, content: [{ type: "text", text: "Carrossel não encontrado." }] };
      const renders = (data.renders as { url: string }[]) ?? [];
      return { content: [{ type: "text", text: `${data.title}: ${data.status}${data.error ? ` (${data.error})` : ""}\nLink: ${appUrl(`/app/c/${data.id}`)}\n${renders.map((r, i) => `Card ${i + 1}: ${r.url}`).join("\n")}` }] };
    },
  );

  return server;
}
