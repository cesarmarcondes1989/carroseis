import type { Slide } from "./types";

/**
 * Score de Save: quanto o roteiro segue o que faz carrossel ser salvo e compartilhado
 * (Instagram 2026 pesa save e envio por DM muito mais que curtida).
 * Determinístico, sem IA: roda no navegador e no servidor.
 */
export type ScoreCheck = { id: string; ok: boolean; weight: number; value?: string };
export type SaveScore = { score: number; checks: ScoreCheck[] };

const CTA_RE = /\b(salv[ae]|salve|guard[ae]|compartilh[ae]|manda|envia|marca|marque|coment[ae]|segue|siga|save|share|send|tag|comment|follow|bookmark)\b/i;
const WORD = (s?: string) => (s ?? "").trim().split(/\s+/).filter(Boolean).length;
const NUMBER_RE = /\d/;

export function saveScore(slides: Slide[]): SaveScore {
  const n = slides.length;
  const cover = slides[0];
  const last = slides[n - 1];
  const inner = slides.slice(1, -1);

  const coverWords = WORD(cover?.titulo);
  const perCard = slides.map((s) => WORD(s.titulo) + WORD(s.texto));
  const avgWords = perCard.length ? perCard.reduce((a, b) => a + b, 0) / perCard.length : 0;
  const longCards = perCard.filter((w) => w > 28).length;
  const longTitles = slides.filter((s) => WORD(s.titulo) > 12).length;
  const emptyInner = inner.filter((s) => !s.texto || WORD(s.texto) < 3).length;
  const lastText = `${last?.titulo ?? ""} ${last?.texto ?? ""}`;
  const dash = slides.some((s) => /[—–]/.test(`${s.titulo} ${s.texto ?? ""}`));

  const checks: ScoreCheck[] = [
    { id: "hook", ok: coverWords > 0 && coverWords <= 10, weight: 20, value: `${coverWords}` },
    { id: "hookNumber", ok: NUMBER_RE.test(cover?.titulo ?? "") || /\?|:/.test(cover?.titulo ?? ""), weight: 8 },
    { id: "microlearning", ok: avgWords <= 22 && longCards === 0, weight: 20, value: `${Math.round(avgWords)}` },
    { id: "oneIdea", ok: longTitles === 0, weight: 12, value: `${longTitles}` },
    { id: "depth", ok: n >= 7, weight: 15, value: `${n}` },
    { id: "body", ok: emptyInner === 0, weight: 10, value: `${emptyInner}` },
    { id: "cta", ok: CTA_RE.test(lastText), weight: 15 },
    { id: "noDash", ok: !dash, weight: 0 },
  ];
  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.reduce((a, c) => a + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

export function scoreTone(score: number): "ok" | "warn" | "bad" {
  return score >= 80 ? "ok" : score >= 55 ? "warn" : "bad";
}
