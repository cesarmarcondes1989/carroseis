import { z } from "zod";
import { handleError } from "@/lib/api";
import { audit, requireAdmin } from "@/lib/admin";
import { adminClient } from "@/lib/supabase/admin";

const planSchema = z.object({
  kind: z.literal("plan"),
  id: z.enum(["free", "weekly", "creator", "pro", "agency"]),
  name: z.string().min(1).max(40).optional(),
  price_cents: z.number().int().min(0).optional(),
  credits: z.number().int().min(0).optional(),
  period_days: z.number().int().min(0).max(3650).optional(),
  highlight: z.boolean().optional(),
  active: z.boolean().optional(),
});
const templateSchema = z.object({
  kind: z.literal("template"),
  id: z.string(),
  active: z.boolean().optional(),
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(400).optional(),
  sort_order: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin();
    const body = z.discriminatedUnion("kind", [planSchema, templateSchema]).parse(await req.json());
    const db = adminClient();
    const { kind, id, ...patch } = body;
    const { error } = await db.from(kind === "plan" ? "plans" : "templates").update(patch).eq("id", id);
    if (error) throw error;
    await audit(actor, `${kind}.update`, null, { id, ...patch });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
