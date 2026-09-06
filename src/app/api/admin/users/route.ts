import { z } from "zod";
import { handleError, requireAdmin } from "@/lib/api";
import { grantCredits, logUsage } from "@/lib/credits";
import { adminClient } from "@/lib/supabase/admin";

const schema = z.object({
  id: z.string().uuid(),
  credits: z.number().int().optional(),
  reason: z.string().max(200).optional(),
  unlimited_credits: z.boolean().optional(),
  role: z.enum(["user", "admin"]).optional(),
  plan: z.enum(["free", "weekly", "creator", "pro", "agency"]).optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());
    const db = adminClient();
    if (body.credits && body.credits !== 0) {
      await grantCredits(body.id, body.credits, "admin_adjust", body.reason || `Ajuste manual por ${admin.email}`, undefined, admin.id);
    }
    const patch: Record<string, unknown> = {};
    if (body.unlimited_credits !== undefined) patch.unlimited_credits = body.unlimited_credits;
    if (body.role) patch.role = body.role;
    if (body.plan) {
      patch.plan = body.plan;
      const { data: plan } = await db.from("plans").select("period_days").eq("id", body.plan).single();
      patch.plan_expires_at = body.plan === "free" ? null : new Date(Date.now() + (plan?.period_days ?? 30) * 86400000).toISOString();
    }
    if (Object.keys(patch).length) {
      const { error } = await db.from("profiles").update(patch).eq("id", body.id);
      if (error) throw error;
    }
    await logUsage(admin.id, "admin.user_update", { target: body.id, ...body });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
