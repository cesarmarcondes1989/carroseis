import { z } from "zod";
import { handleError, HttpError, requireProfile } from "@/lib/api";
import { createSeries, listBrandModels } from "@/lib/carousel-service";
import { extractUrl, extractYoutube, isYoutube } from "@/lib/extract";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  templateId: z.string(),
  topic: z.string().min(3).max(12000),
  url: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()),
  count: z.coerce.number().int().min(2).max(7).default(4),
  slidesCount: z.coerce.number().int().min(4).max(10).default(8),
  tone: z.string().max(40).default("direto"),
  aspect: z.enum(["4:5", "1:1"]).default("4:5"),
  coverMode: z.enum(["ai", "own", "none"]).default("none"),
  handle: z.string().max(60).optional(),
  brandModelId: z.string().uuid().optional().or(z.literal("")),
  seamless: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(false),
});

/** POST JSON. Planeja a série com IA e cria todos os carrosséis (roteiro por IA em cada um). */
export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const locale = await getLocale();
    const input = schema.parse(await req.json());
    let sourceText: string | null = null;
    let topic = input.topic.trim();
    if (input.url) {
      const ex = isYoutube(input.url) ? await extractYoutube(input.url) : await extractUrl(input.url);
      sourceText = ex.text;
      topic = topic || ex.title || input.url;
    }
    if (!topic) throw new HttpError(400, "Escreva o tema da série.");
    const models = input.brandModelId ? await listBrandModels(profile.id) : [];
    const brandModel = input.brandModelId ? models.find((m) => m.id === input.brandModelId) ?? null : null;
    const series = await createSeries({
      profile,
      templateId: input.templateId,
      topic,
      sourceInput: sourceText,
      source: input.url ? (isYoutube(input.url) ? "youtube" : "url") : "topic",
      count: input.count,
      slidesCount: input.slidesCount,
      tone: input.tone,
      locale,
      aspect: input.aspect,
      coverMode: input.coverMode,
      handle: input.handle,
      brandModel,
      seamless: input.seamless,
    });
    return Response.json({ series });
  } catch (e) {
    return handleError(e);
  }
}
