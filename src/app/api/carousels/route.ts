import { z } from "zod";
import { handleError, HttpError, requireProfile } from "@/lib/api";
import { createCarousel, listBrandModels, parseScriptText } from "@/lib/carousel-service";
import { extractPdf, extractUrl, extractYoutube, isYoutube } from "@/lib/extract";
import { getLocale } from "@/lib/i18n/server";
import type { CarouselSource } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  templateId: z.string(),
  source: z.enum(["topic", "url", "youtube", "pdf", "script"]),
  topic: z.string().max(12000).optional(),
  url: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()),
  script: z.string().max(20000).optional(),
  slidesCount: z.coerce.number().int().min(2).max(10).default(7),
  tone: z.string().max(40).default("direto"),
  aspect: z.enum(["4:5", "1:1"]).default("4:5"),
  coverMode: z.enum(["ai", "own", "none"]).default("none"),
  coverScene: z.string().max(600).optional(),
  handle: z.string().max(60).optional(),
  brandModelId: z.string().uuid().optional().or(z.literal("")),
});

/** POST multipart/form-data ou JSON. Cria o carrossel (e escreve o roteiro com IA quando preciso). */
export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const locale = await getLocale();
    let body: Record<string, unknown> = {};
    let pdf: File | null = null;
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      form.forEach((v, k) => {
        if (v instanceof File) pdf = v;
        else body[k] = v;
      });
    } else {
      body = await req.json();
    }
    const input = schema.parse(body);

    let sourceText: string | null = null;
    let topic = input.topic?.trim() || "";
    let source: CarouselSource = input.source;
    if (input.source === "url" || input.source === "youtube") {
      if (!input.url) throw new HttpError(400, "Informe o link.");
      const ex = isYoutube(input.url) ? await extractYoutube(input.url) : await extractUrl(input.url);
      source = ex.source;
      sourceText = ex.text;
      topic = topic || ex.title || input.url;
    } else if (input.source === "pdf") {
      if (!pdf) throw new HttpError(400, "Envie o PDF.");
      const f = pdf as File;
      const ex = await extractPdf(await f.arrayBuffer(), f.name);
      sourceText = ex.text;
      topic = topic || ex.title || "PDF";
    } else if (input.source === "topic" && !topic) {
      throw new HttpError(400, "Escreva o tema.");
    }

    const slides = input.source === "script" ? parseScriptText(input.script ?? "") : null;
    if (input.source === "script" && (!slides || slides.length < 2)) throw new HttpError(400, "O roteiro precisa de pelo menos 2 cards (um por linha).");

    const models = input.brandModelId ? await listBrandModels(profile.id) : [];
    const brandModel = input.brandModelId ? models.find((m) => m.id === input.brandModelId) ?? null : null;

    const carousel = await createCarousel({
      profile,
      templateId: input.templateId,
      source,
      sourceInput: sourceText ?? topic,
      topic: topic || slides?.[0]?.titulo || null,
      slides,
      slidesCount: input.slidesCount,
      tone: input.tone,
      locale,
      aspect: input.aspect,
      coverMode: input.coverMode,
      coverScene: input.coverScene,
      handle: input.handle,
      brandModel,
      title: slides?.[0]?.titulo ?? null,
    });
    return Response.json({ carousel });
  } catch (e) {
    return handleError(e);
  }
}
