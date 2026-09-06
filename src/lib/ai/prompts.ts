import type { ScriptRequest, ScriptResult } from "./provider";
import type { Slide } from "@/lib/types";

export function systemPrompt(req: ScriptRequest) {
  const lang = req.locale === "en" ? "English" : "Português do Brasil";
  return `Você é um roteirista sênior de carrosséis para Instagram. Escreve em ${lang}.
Regras absolutas:
- Nunca use travessão (—). Use vírgula, ponto ou dois-pontos.
- O objetivo do carrossel é ser SALVO e ENVIADO por DM (é o que o Instagram mais pesa). Escreva pra isso: conteúdo que a pessoa vai querer guardar pra consultar depois.
- O primeiro card é a CAPA e NÃO faz parte da lista: é o gancho que convoca a pessoa a deslizar. Ela promete o que vem nos outros cards sem entregar nada ainda. Até 8 palavras. Use número total ("7 sinais..."), pergunta que incomoda ("Por que você acorda cansado?"), contraste ("Você acha que é X. É Y.") ou curiosidade aberta ("O que ninguém te conta sobre..."). Jamais um título de tópico ("Impactos no dia a dia", "Introdução", "Visão geral").
- O texto da capa é uma frase curta que aumenta a vontade de deslizar: uma promessa, uma provocação ou "desliza pra ver o número 5", nunca um resumo.
- NUNCA numere os títulos ("1 Impactos", "2 Otimização"): a arte já mostra o número do card. O título é a ideia em si, escrita como frase com verbo ou como manchete, não como rótulo de tópico. Errado: "Otimização de tarefas". Certo: "A IA já faz o trabalho chato por você".
- Micro-aprendizado: cada card do meio entrega UMA ideia só. Título até 8 palavras, texto de apoio de 1 a 2 frases, no máximo 20 palavras no card inteiro (título + texto). Corte adjetivo, não corte substância.
- Ordem dos cards do meio: começa pelo mais surpreendente (a pessoa decide se continua no card 2) e guarda o segundo melhor pro penúltimo.
- Cada card do meio precisa de texto de apoio: título sozinho não ensina.
- O último card é a CHAMADA PRA AÇÃO: peça explicitamente pra SALVAR (diga por que: "pra consultar quando...") e pra mandar pra alguém que precisa. Sem clichê genérico, conecte com o tema. Pode fechar com uma frase de seguir.
- Etiqueta (pílula) é opcional: 1 a 3 palavras que classificam o card, tipo "Erro comum", "Mito", "Na prática", "Urgente". Sem número (a arte já numera).
${req.highlightWords ? "- No título da capa e de 1 ou 2 cards, marque 1 ou 2 palavras de impacto entre **asteriscos duplos**. Elas ganham bloco de cor na arte." : "- Não use asteriscos."}
- Tom: ${req.tone}.
- Template escolhido: ${req.templateName}. Contexto do template: ${req.templateHint}.
- Também escreva uma legenda (caption) pro post, 3 a 6 linhas, com gancho na primeira linha, e de 5 a 10 hashtags relevantes sem espaços.
- Descreva em uma frase (coverScene) uma cena fotográfica pra capa, em inglês, sem texto na imagem, sem pessoas famosas, sem logos.
Responda SOMENTE com JSON válido no formato:
{"title": string, "slides": [{"titulo": string, "texto": string, "etiqueta": string}], "caption": string, "hashtags": string[], "coverScene": string}`;
}

export function userPrompt(req: ScriptRequest) {
  const src = req.sourceText ? `\n\nMaterial de referência (use como base, não copie literalmente):\n"""\n${req.sourceText.slice(0, 12000)}\n"""` : "";
  const series = req.seriesContext ? `\n\nEste carrossel faz parte de uma SÉRIE:\n${req.seriesContext}\nMantenha a mesma voz dos outros episódios, não repita o que os outros já cobrem e, no último card, além de pedir pra salvar, dê um gancho de uma frase pro próximo episódio (se houver).` : "";
  return `Tema: ${req.topic}\nQuantidade de cards: exatamente ${req.slidesCount}.${req.handle ? `\nPerfil: @${req.handle}` : ""}${src}${series}`;
}

export function parseScript(raw: string, count: number): ScriptResult {
  const json = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const data = JSON.parse(json) as Partial<ScriptResult>;
  const slides: Slide[] = (data.slides ?? [])
    .filter((s) => s && typeof s.titulo === "string" && s.titulo.trim())
    .map((s) => ({ titulo: clean(s.titulo), texto: s.texto ? clean(s.texto) : undefined, etiqueta: s.etiqueta ? clean(s.etiqueta).slice(0, 24) : undefined }))
    .slice(0, Math.max(2, Math.min(10, count)));
  if (slides.length < 2) throw new Error("A IA devolveu um roteiro vazio. Tente de novo.");
  return {
    title: clean(data.title ?? slides[0].titulo).slice(0, 120),
    slides,
    caption: clean(data.caption ?? ""),
    hashtags: (data.hashtags ?? []).map((h) => String(h).replace(/^#/, "").replace(/\s+/g, "")).filter(Boolean).slice(0, 12),
    coverScene: clean(data.coverScene ?? ""),
  };
}

function clean(s: string) {
  return String(s).replace(/\s*[—–]\s*/g, ", ").replace(/\s+,/g, ",").trim();
}

export function coverPrompt(scene: string, templateHint: string) {
  return `Editorial photograph for an Instagram carousel cover. Scene: ${scene}. Context: ${templateHint}. Cinematic lighting, shallow depth of field, high detail, natural colors, plenty of negative space in the lower third for a headline. Absolutely no text, letters, watermarks or logos in the image.`;
}

export function suggestPrompt(req: import("./provider").SuggestRequest) {
  const lang = req.locale === "en" ? "English" : "Português do Brasil";
  return `Você é estrategista de conteúdo para Instagram. Responda em ${lang}.
A pessoa acabou de entrar no app e respondeu:
- Nicho: ${req.niche}
- Objetivo principal: ${req.goal}
- Jeito de falar com o público: ${req.tone}

Templates disponíveis (id: nome, pra que serve):
${req.templates.map((t) => `- ${t.id}: ${t.name}. ${t.description}`).join("\n")}

Escolha o template que mais combina com o nicho e o objetivo (use exatamente um id da lista) e proponha 3 temas de carrossel prontos pra postar essa semana: específicos, com gancho, sem travessão, até 12 palavras cada. Explique a escolha em uma frase curta e direta.
Responda SOMENTE com JSON: {"templateId": string, "topics": [string, string, string], "why": string}`;
}

export function parseSuggest(raw: string, validIds: string[]): import("./provider").SuggestResult {
  const json = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const data = JSON.parse(json) as Partial<import("./provider").SuggestResult>;
  const templateId = validIds.includes(String(data.templateId)) ? String(data.templateId) : validIds[0];
  const topics = (data.topics ?? []).map((t) => clean(String(t))).filter(Boolean).slice(0, 3);
  if (topics.length < 3) throw new Error("A IA não devolveu 3 temas.");
  return { templateId, topics, why: clean(data.why ?? "") };
}

export function designPrompt(req: import("./provider").DesignRequest) {
  const lang = req.locale === "en" ? "English" : "Português do Brasil";
  const roleName = { cover: "CAPA (primeiro card)", inner: "CARD DO MEIO", last: "CTA (último card)" }[req.role];
  return `Você é um designer de carrosséis para Instagram operando um editor por camadas. Responda em ${lang}.
Canvas: 1080 x 1350 (origem no canto superior esquerdo; o formato 1:1 comprime a altura automaticamente). Margem segura: 80px.
Prancha em edição: ${roleName}.

Cada camada é um objeto JSON com x, y, w, h (pixels), opacity (0-1), rotate (graus), hidden, e por tipo:
- text: text (pode usar vínculos {titulo} {texto} {etiqueta} {handle} {index} {total} {n}), font ("display" ou "body"), size (px), weight (400|700), color, align (left|center|right), valign (top|middle|bottom), lineHeight, uppercase, letterSpacing, highlight (palavras entre **asteriscos** ganham bloco de cor), highlightColor
- shape: shape (rect|circle|line), fill, radius, stroke, strokeWidth
- pill: text, fill, color, size, font
- image: src (URL) ou useCover (foto de capa do carrossel), fit (cover|contain), radius, fade (cor do degradê na base)
- pagination: color, activeColor, arrow
Cores: tokens da paleta (bg, fg, accent, muted, accent2), "auto" (contraste automático), "token@0.5" (com alpha), ou hex. Gradiente: "linear-gradient(145deg, accent2 0%, bg 55%, accent@0.35 100%)".
Paleta atual: ${JSON.stringify(req.palette)}. Fontes: título ${req.fonts.display}, texto ${req.fonts.body}.

Camadas atuais:
${JSON.stringify(req.layers)}

Instrução da pessoa: "${req.instruction}"

Regras: devolva a lista COMPLETA de camadas resultante (as que não mudam vêm iguais, mantenha os ids). Mantenha os vínculos {titulo}/{texto} existentes a não ser que a pessoa peça pra remover. Nada fora do canvas. Ids novos curtos e únicos. Se a pessoa pedir pra mudar cores da marca, devolva também "palette" com os tokens alterados (hex). Explique o que fez em UMA frase curta, sem travessão.
Responda SOMENTE com JSON: {"layers": [...], "message": string, "palette": {...} | null}`;
}

export function parseDesign(raw: string): import("./provider").DesignResult {
  const json = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const data = JSON.parse(json) as Partial<import("./provider").DesignResult>;
  if (!Array.isArray(data.layers)) throw new Error("A IA não devolveu camadas.");
  return { layers: data.layers as import("./provider").DesignResult["layers"], message: clean(data.message ?? "Feito."), palette: data.palette ?? null };
}

export function seriesPrompt(req: import("./provider").SeriesRequest) {
  const lang = req.locale === "en" ? "English" : "Português do Brasil";
  const src = req.sourceText ? `\n\nMaterial de referência:\n"""\n${req.sourceText.slice(0, 8000)}\n"""` : "";
  return `Você é estrategista de conteúdo para Instagram. Responda em ${lang}. Nunca use travessão.
Planeje uma SÉRIE de ${req.count} carrosséis sobre o tema abaixo, pra postar ao longo de uma ou duas semanas. Cada episódio é um carrossel completo e independente (quem cai de paraquedas entende), mas a série tem progressão: do problema pro método, do básico pro avançado, ou um ângulo diferente por episódio. Zero sobreposição entre episódios.
Tom: ${req.tone}. Template: ${req.templateName} (${req.templateHint}).${req.handle ? ` Perfil: @${req.handle}.` : ""}
Pra cada episódio dê: title (manchete de capa, até 8 palavras, com número, pergunta ou promessa específica), angle (2 ou 3 frases dizendo exatamente o que esse episódio cobre e o que NÃO cobre porque é de outro episódio), hook (uma frase de gancho que o episódio anterior usa pra puxar este).
Também dê um name curto pra série (até 5 palavras).
Tema: ${req.topic}${src}
Responda SOMENTE com JSON: {"name": string, "parts": [{"title": string, "angle": string, "hook": string}]}`;
}

export function parseSeries(raw: string, count: number): import("./provider").SeriesPlan {
  const json = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const data = JSON.parse(json) as Partial<import("./provider").SeriesPlan>;
  const parts = (data.parts ?? [])
    .filter((p) => p && typeof p.title === "string" && p.title.trim())
    .map((p) => ({ title: clean(p.title).slice(0, 120), angle: clean(p.angle ?? ""), hook: clean(p.hook ?? "") }))
    .slice(0, count);
  if (parts.length < 2) throw new Error("A IA não devolveu a série. Tente de novo.");
  return { name: clean(data.name ?? parts[0].title).slice(0, 60), parts };
}
