import type { Slide } from "@/lib/types";

const HEADER = /^\s*(?:[#*\-•]+\s*)?(?:capa|cover|card|slide|p[aá]gina|page|cta|fechamento|encerramento|chamada)\b\s*(?:\d+)?\s*(?:[:\-–—.)\]]|$)/i;
const NUMBERED = /^\s*(?:\d{1,2}|[①-⑩])\s*[.)\-:–—]\s+/;
const LABEL_PREFIX = /^\s*(?:t[ií]tulo|texto|subt[ií]tulo|headline|body|corpo|etiqueta|tag|label)\s*[:\-–—]\s*/i;

function clean(s: string) {
  return s.replace(/\*\*/g, "").replace(/^[\s#*\-•>]+/, "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+,/g, ",").trim();
}

/**
 * Sinais de que o texto é um roteiro pronto (e não um tema): várias linhas e
 * marcadores de card (CAPA, CARD 2, CTA), numeração ou separador "|".
 */
export function looksLikeScript(text: string) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const headers = lines.filter((l) => HEADER.test(l)).length;
  const numbered = lines.filter((l) => NUMBERED.test(l)).length;
  const pipes = lines.filter((l) => l.includes("|")).length;
  return headers >= 2 || numbered >= 3 || pipes >= 2;
}

/**
 * Converte texto em cards. Aceita:
 *  - blocos com cabeçalho (CAPA / CARD 2 / CTA): primeira linha do bloco é o
 *    título, o resto vira texto; "Título:" e "Texto:" são respeitados
 *  - linhas numeradas (1. ..., 2) ...): cada uma é um card
 *  - uma linha por card, com "Título | Texto" opcional
 */
export function parseScript(raw: string): Slide[] {
  const lines = raw.split(/\n/).map((l) => l.replace(/\s+$/, ""));
  const hasHeaders = lines.filter((l) => HEADER.test(l)).length >= 2;

  if (hasHeaders) {
    const slides: Slide[] = [];
    let current: string[] | null = null;
    let currentHeader = "";
    const flush = () => {
      if (!current) return;
      const body = current.map((l) => l.trim()).filter(Boolean);
      let titulo = "";
      const texto: string[] = [];
      for (const l of body) {
        const m = LABEL_PREFIX.exec(l);
        if (m && /^t[ií]tulo|headline/i.test(l)) titulo = titulo || clean(l.slice(m[0].length));
        else if (m) texto.push(clean(l.slice(m[0].length)));
        else if (!titulo) titulo = clean(l);
        else texto.push(clean(l));
      }
      if (!titulo && currentHeader) titulo = currentHeader;
      if (titulo) slides.push({ titulo, texto: texto.join("\n") || undefined, etiqueta: /^(cta|chamada|fechamento|encerramento)/i.test(currentHeader) ? "CTA" : undefined });
    };
    for (const l of lines) {
      if (HEADER.test(l)) {
        flush();
        current = [];
        currentHeader = clean(l.replace(HEADER, "")) || clean(l);
        const inline = clean(l.replace(HEADER, ""));
        if (inline) current.push(inline);
      } else if (current) current.push(l);
      // texto antes do primeiro cabeçalho ("Estrutura do carrossel") é preâmbulo, não card
    }
    flush();
    return slides.slice(0, 10);
  }

  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const stripped = l.replace(NUMBERED, "");
      const [titulo, ...rest] = stripped.split("|");
      return { titulo: clean(titulo), texto: rest.length ? clean(rest.join("|")) || undefined : undefined };
    })
    .filter((s) => s.titulo)
    .slice(0, 10);
}
