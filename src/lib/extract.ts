import "server-only";
import * as cheerio from "cheerio";

export type Extracted = { title: string; text: string; source: "url" | "youtube" | "pdf" };

const UA = "Mozilla/5.0 (compatible; DeslizaIA/1.0; +https://desliza.ia)";

export function isYoutube(url: string) {
  return /(?:youtube\.com|youtu\.be)\//i.test(url);
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

/** Artigo/matéria: título + parágrafos principais. */
export async function extractUrl(url: string): Promise<Extracted> {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Não consegui abrir o link (${res.status}).`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside, form, noscript, iframe, svg").remove();
  const title = ($('meta[property="og:title"]').attr("content") || $("h1").first().text() || $("title").text()).trim();
  const desc = ($('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "").trim();
  const container = $("article").length ? $("article") : $("main").length ? $("main") : $("body");
  const paragraphs = container
    .find("p, h2, h3, li")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter((p) => p.length > 40);
  const text = [desc, ...paragraphs].filter(Boolean).join("\n").slice(0, 20000);
  if (text.length < 200) throw new Error("A página não tem texto suficiente pra virar carrossel.");
  return { title, text, source: "url" };
}

/** YouTube: transcrição (legendas) + título via oEmbed. */
export async function extractYoutube(url: string): Promise<Extracted> {
  const id = youtubeId(url);
  if (!id) throw new Error("Link do YouTube inválido.");
  let title = "";
  try {
    const o = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { signal: AbortSignal.timeout(8000) });
    if (o.ok) title = ((await o.json()) as { title?: string }).title ?? "";
  } catch {
    /* segue sem título */
  }
  const { YoutubeTranscript } = await import("youtube-transcript");
  let items: { text: string }[] = [];
  for (const lang of ["pt", "pt-BR", "en", undefined]) {
    try {
      items = await YoutubeTranscript.fetchTranscript(id, lang ? { lang } : undefined);
      if (items.length) break;
    } catch {
      /* tenta próximo idioma */
    }
  }
  if (!items.length) throw new Error("Esse vídeo não tem legenda disponível. Cole o resumo do vídeo no campo de tema.");
  const text = items.map((i) => i.text).join(" ").replace(/\s+/g, " ").slice(0, 20000);
  return { title, text, source: "youtube" };
}

/** PDF: texto de todas as páginas (unpdf roda em serverless sem worker). */
export async function extractPdf(data: ArrayBuffer | Uint8Array, filename = ""): Promise<Extracted> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = String(text).replace(/\s+/g, " ").trim().slice(0, 30000);
  if (clean.length < 200) throw new Error("Não achei texto nesse PDF (pode ser só imagem).");
  return { title: filename.replace(/\.pdf$/i, ""), text: clean, source: "pdf" };
}
