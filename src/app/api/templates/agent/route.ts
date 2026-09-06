import { z } from "zod";
import { handleError, HttpError, requireProfile } from "@/lib/api";
import { getAI } from "@/lib/ai/provider";
import { layerSchema } from "@/lib/layers/types";
import { canEditTemplates } from "@/lib/templates/custom";
import { logUsage } from "@/lib/credits";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  instruction: z.string().min(2).max(1000),
  role: z.enum(["cover", "inner", "last"]),
  layers: z.array(layerSchema).max(40),
  palette: z.object({ bg: z.string(), fg: z.string(), accent: z.string(), muted: z.string(), accent2: z.string() }).passthrough(),
  fonts: z.object({ display: z.string(), body: z.string() }),
  aspect: z.enum(["4:5", "1:1"]).default("4:5"),
});

/** Agente designer: instrução em linguagem natural → camadas alteradas. Grátis. */
export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    if (!canEditTemplates(profile)) throw new HttpError(402, "AGENCY_REQUIRED");
    const body = schema.parse(await req.json());
    const ai = await getAI();
    const result = await ai.designAgent({ ...body, locale: await getLocale() });
    const layers = z.array(layerSchema).max(40).parse(result.layers);
    await logUsage(profile.id, "template.agent", { role: body.role, chars: body.instruction.length });
    return Response.json({ layers, message: result.message, palette: result.palette ?? null });
  } catch (e) {
    return handleError(e);
  }
}
