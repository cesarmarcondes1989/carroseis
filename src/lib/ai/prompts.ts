import type { ScriptRequest, ScriptResult } from "./provider";
import type { Slide } from "@/lib/types";

export function systemPrompt(req: ScriptRequest) {
  const lang = req.locale === "en" ? "English" : "Português do Brasil";
  return `Você é um roteirista sênior de carrosséis para Instagram. Escreve em ${lang}.
Regras absolutas:
- Nunca use travessão (—). Use vírgula, ponto ou dois-pontos.
- O primeiro card é a CAPA: manchete curta, forte, que para o dedo. Até 10 palavras.
- Os cards do meio entregam valor de verdade: um insight por card, título até 12 palavras, texto de apoio de 1 a 3 frases curtas.
- O último card é a CHAMADA PRA AÇÃO: salvar, compartilhar, seguir ou comentar. Sem clichê genérico, conecte com o tema.
- Etiqueta (pílula) é opcional: 1 a 3 palavras, tipo "Dica 1", "Erro comum", "Urgente".
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
  return `Tema: ${req.topic}\nQuantidade de cards: exatamente ${req.slidesCount}.${req.handle ? `\nPerfil: @${req.handle}` : ""}${src}`;
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
