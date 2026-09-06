import { z } from "zod";
import { handleError, HttpError, requireProfile } from "@/lib/api";
import { layerTemplateSchema } from "@/lib/layers/types";
import { canEditTemplates, listUserTemplates, rowToTemplate } from "@/lib/templates/custom";
import { TEMPLATE_IDS } from "@/lib/templates/registry";
import { adminClient } from "@/lib/supabase/admin";
import { logUsage } from "@/lib/credits";

const paletteSchema = z.object({ bg: z.string(), fg: z.string(), accent: z.string(), muted: z.string(), accent2: z.string(), cycle: z.array(z.string()).optional() });
const upsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(60),
  description: z.string().max(300).nullable().optional(),
  base_template_id: z.enum(TEMPLATE_IDS as [string, ...string[]]).default("marketing"),
  palette: paletteSchema,
  fonts: z.object({ display: z.string().max(40), body: z.string().max(40) }),
  layers: layerTemplateSchema,
  supports_ai_cover: z.boolean().default(true),
});

export async function GET() {
  try {
    const profile = await requireProfile();
    const rows = await listUserTemplates(profile.id);
    return Response.json({ templates: rows.map(rowToTemplate), canEdit: canEditTemplates(profile) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    if (!canEditTemplates(profile)) throw new HttpError(402, "AGENCY_REQUIRED");
    const body = upsert.parse(await req.json());
    const db = adminClient();
    const { id, ...rest } = body;
    const row = { ...rest, user_id: profile.id };
    const q = id ? db.from("user_templates").update(row).eq("id", id).eq("user_id", profile.id) : db.from("user_templates").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) throw error;
    await logUsage(profile.id, id ? "template.update" : "template.create", { id: data.id, base: body.base_template_id });
    return Response.json({ template: rowToTemplate(data) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await requireProfile();
    const { id } = z.object({ id: z.string().uuid() }).parse(await req.json());
    await adminClient().from("user_templates").delete().eq("id", id).eq("user_id", profile.id);
    await logUsage(profile.id, "template.delete", { id });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
