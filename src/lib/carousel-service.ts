import "server-only";
import { adminClient, publicStorageUrl } from "@/lib/supabase/admin";
import { getAI } from "@/lib/ai/provider";
import { consumeCredits, grantCredits, logUsage } from "@/lib/credits";
import { renderAll, toDataUrl } from "@/lib/render/render";
import { resolveStyle } from "@/lib/render/Slide";
import { listTemplates, resolveTemplateId, templateForCarousel } from "@/lib/templates/custom";
export { listTemplates };
import { CREDIT_COST, type Aspect, type BrandModel, type BrandOverrides, type Carousel, type CarouselSource, type CoverMode, type Profile, type Render, type Slide } from "@/lib/types";

export async function listBrandModels(userId: string): Promise<BrandModel[]> {
  const { data } = await adminClient().from("brand_models").select("*").eq("user_id", userId).order("is_default", { ascending: false }).order("created_at");
  return (data as BrandModel[]) ?? [];
}

export function overridesFromModel(m: BrandModel | null | undefined): BrandOverrides | null {
  if (!m) return null;
  return { palette: m.palette ?? undefined, font_display: m.font_display, font_body: m.font_body, text_scale: Number(m.text_scale ?? 1), instagram_handle: m.instagram_handle };
}

export { parseScript as parseScriptText } from "@/lib/script-parse";

export type CreateInput = {
  profile: Profile;
  templateId: string;
  source: CarouselSource;
  sourceInput?: string | null; // tema ou texto extraído
  topic?: string | null;
  slides?: Slide[] | null; // roteiro pronto (não usa IA)
  slidesCount?: number;
  tone?: string;
  locale?: "pt-BR" | "en";
  aspect?: Aspect;
  coverMode?: CoverMode;
  coverScene?: string | null;
  handle?: string | null;
  brandModel?: BrandModel | null;
  title?: string | null;
  seamless?: boolean;
};

/** Cria o registro do carrossel; escreve o roteiro com IA quando não veio pronto. Cobra créditos. */
export async function createCarousel(input: CreateInput): Promise<Carousel> {
  const db = adminClient();
  const { template, userTemplateId } = await resolveTemplateId(input.templateId, input.profile.id);
  const coverMode: CoverMode = template.supports_ai_cover ? (input.coverMode ?? "none") : input.coverMode === "own" ? "own" : "none";
  const useAI = !input.slides || input.slides.length < 2;
  const cost = CREDIT_COST.carousel + (useAI ? CREDIT_COST.aiScript : 0);

  const { data: row, error } = await db
    .from("carousels")
    .insert({
      user_id: input.profile.id,
      title: input.title || input.topic?.split(/\n/)[0]?.slice(0, 80) || "Novo carrossel",
      template_id: template.base_template_id ?? template.id,
      user_template_id: userTemplateId,
      brand_model_id: input.brandModel?.id ?? null,
      aspect: input.aspect ?? "4:5",
      status: useAI ? "generating" : "draft",
      source: input.source,
      source_input: input.sourceInput ?? input.topic ?? null,
      slides: input.slides ?? [],
      cover_mode: coverMode,
      cover_scene: input.coverScene ?? null,
      brand_overrides: overridesFromModel(input.brandModel),
      seamless: !!input.seamless,
      instagram_handle: input.handle?.replace(/^@/, "") || input.brandModel?.instagram_handle || input.profile.instagram_handle || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const carousel = row as Carousel;

  await consumeCredits(input.profile.id, cost, "carousel", `Carrossel: ${carousel.title}`, carousel.id);
  await db.from("carousels").update({ credits_spent: cost }).eq("id", carousel.id);
  await logUsage(input.profile.id, "carousel.create", { source: input.source, template: template.id, ai: useAI });

  if (!useAI) return { ...carousel, credits_spent: cost };

  try {
    const ai = await getAI();
    const script = await ai.generateScript({
      topic: input.topic || input.title || "Conteúdo",
      sourceText: input.source === "topic" ? (input.topic && input.topic.length > 300 ? input.topic : null) : input.sourceInput,
      templateName: template.name,
      templateHint: template.description,
      slidesCount: input.slidesCount ?? 7,
      tone: input.tone ?? "direto",
      locale: input.locale ?? "pt-BR",
      handle: carousel.instagram_handle,
      highlightWords: template.layout === "news" || template.layout === "niche",
    });
    const { data: updated } = await db
      .from("carousels")
      .update({
        status: "draft",
        title: script.title || carousel.title,
        slides: script.slides,
        caption: script.caption,
        hashtags: script.hashtags,
        cover_scene: carousel.cover_scene || script.coverScene,
      })
      .eq("id", carousel.id)
      .select("*")
      .single();
    return updated as Carousel;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha na IA";
    await grantCredits(input.profile.id, cost, "refund", `Estorno: ${msg}`, carousel.id);
    await db.from("carousels").update({ status: "error", error: msg, credits_spent: 0 }).eq("id", carousel.id);
    throw new Error(msg);
  }
}

/** Reescreve o roteiro de um carrossel existente (cobra aiScript). */
export async function rewriteScript(carousel: Carousel, profile: Profile, locale: "pt-BR" | "en", tone = "direto") {
  const db = adminClient();
  const template = await templateForCarousel(carousel);
  await consumeCredits(profile.id, CREDIT_COST.aiScript, "carousel", `Reescrita: ${carousel.title}`, carousel.id);
  const ai = await getAI();
  const script = await ai.generateScript({
    topic: carousel.title,
    sourceText: carousel.source_input,
    templateName: template.name,
    templateHint: template.description,
    slidesCount: Math.max(2, carousel.slides.length || 7),
    tone,
    locale,
    handle: carousel.instagram_handle,
    highlightWords: template.layout === "news" || template.layout === "niche",
  });
  const { data } = await db
    .from("carousels")
    .update({ slides: script.slides, caption: script.caption, hashtags: script.hashtags, status: "draft", renders: [], credits_spent: carousel.credits_spent + CREDIT_COST.aiScript })
    .eq("id", carousel.id)
    .select("*")
    .single();
  return data as Carousel;
}

/** Gera a capa por IA, sobe no Storage e cobra 10 créditos (uma vez por carrossel). */
export async function generateCover(carousel: Carousel, profile: Profile, scene?: string | null): Promise<Carousel> {
  const db = adminClient();
  const finalScene = (scene || carousel.cover_scene || carousel.title).trim();
  if (!carousel.cover_ai_charged) {
    await consumeCredits(profile.id, CREDIT_COST.aiCover, "ai_cover", `Capa por IA: ${carousel.title}`, carousel.id);
  }
  try {
    const ai = await getAI();
    const { buffer, mime } = await ai.generateCoverImage(finalScene, carousel.seamless ? "wide" : carousel.aspect);
    const path = `${carousel.user_id}/${carousel.id}/cover-${Date.now()}.png`;
    const { error } = await db.storage.from("carousels").upload(path, buffer, { contentType: mime, upsert: true });
    if (error) throw error;
    const { data } = await db
      .from("carousels")
      .update({ cover_image_path: path, cover_mode: "ai", cover_scene: finalScene, cover_ai_charged: true, renders: [], credits_spent: carousel.credits_spent + (carousel.cover_ai_charged ? 0 : CREDIT_COST.aiCover) })
      .eq("id", carousel.id)
      .select("*")
      .single();
    await logUsage(profile.id, "cover.generate", { carousel: carousel.id });
    return data as Carousel;
  } catch (e) {
    if (!carousel.cover_ai_charged) await grantCredits(profile.id, CREDIT_COST.aiCover, "refund", "Estorno: capa por IA falhou", carousel.id);
    throw e;
  }
}

/** Pinta todos os PNGs e sobe no Storage. Grátis (o custo é na criação). */
export async function renderCarousel(carousel: Carousel, profile?: Profile | null): Promise<Carousel> {
  const db = adminClient();
  const template = await templateForCarousel(carousel);
  await db.from("carousels").update({ status: "rendering", error: null }).eq("id", carousel.id);
  try {
    const style = resolveStyle(template, carousel.brand_overrides, carousel.instagram_handle);
    const coverImage = carousel.cover_image_path ? await toDataUrl(publicStorageUrl(carousel.cover_image_path)) : null;
    const avatarUrl = profile?.avatar_url ? await toDataUrl(profile.avatar_url) : null;
    const pngs = await renderAll({ template, style, slides: carousel.slides, aspect: carousel.aspect, coverImage, authorName: profile?.full_name ?? null, avatarUrl, seamless: carousel.seamless, title: carousel.title });
    const stamp = Date.now();
    const renders: Render[] = [];
    for (let i = 0; i < pngs.length; i++) {
      const path = `${carousel.user_id}/${carousel.id}/${stamp}/slide-${String(i + 1).padStart(2, "0")}.png`;
      const { error } = await db.storage.from("carousels").upload(path, pngs[i], { contentType: "image/png", upsert: true });
      if (error) throw error;
      renders.push({ index: i, path, url: publicStorageUrl(path) });
    }
    const { data } = await db.from("carousels").update({ status: "ready", renders }).eq("id", carousel.id).select("*").single();
    await logUsage(carousel.user_id, "carousel.render", { carousel: carousel.id, slides: pngs.length });
    return data as Carousel;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao pintar";
    await db.from("carousels").update({ status: "error", error: msg }).eq("id", carousel.id);
    throw e;
  }
}

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
