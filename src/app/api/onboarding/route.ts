import { z } from "zod";
import { handleError, requireProfile } from "@/lib/api";
import { getAI } from "@/lib/ai/provider";
import { listTemplates } from "@/lib/carousel-service";
import { logUsage } from "@/lib/credits";
import { getLocale } from "@/lib/i18n/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const answers = z.object({
  niche: z.string().min(2).max(80),
  goal: z.string().min(2).max(80),
  tone: z.string().min(2).max(40),
  handle: z.string().max(60).optional(),
});

/** POST: recebe as 3 respostas, devolve template recomendado + 3 temas. Grátis. */
export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const a = answers.parse(await req.json());
    const locale = await getLocale();
    const templates = (await listTemplates()).map((t) => ({ id: t.id, name: t.name, description: t.description }));
    const ai = await getAI();
    const s = await ai.suggest({ ...a, locale, templates });
    const handle = a.handle?.replace(/^@/, "").trim() || null;
    await adminClient()
      .from("profiles")
      .update({ onboarding: { ...a, handle, templateId: s.templateId, topics: s.topics }, ...(handle && !profile.instagram_handle ? { instagram_handle: handle } : {}) })
      .eq("id", profile.id);
    await logUsage(profile.id, "onboarding.suggest", { niche: a.niche, goal: a.goal, template: s.templateId });
    return Response.json(s);
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH: marca o onboarding como concluído (ou pulado). */
export async function PATCH(req: Request) {
  try {
    const profile = await requireProfile();
    const { skipped } = z.object({ skipped: z.boolean().optional() }).parse(await req.json().catch(() => ({})));
    await adminClient().from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", profile.id);
    await logUsage(profile.id, skipped ? "onboarding.skip" : "onboarding.done");
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
