import { z } from "zod";
import { handleError, HttpError } from "@/lib/api";
import { assertCanManage, audit, isOwnerEmail, requireAdmin } from "@/lib/admin";
import { grantCredits } from "@/lib/credits";
import { adminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

const schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["credits", "plan", "unlimited", "role", "ban", "unban", "notes", "delete", "revoke_keys"]),
  credits: z.number().int().optional(),
  reason: z.string().max(300).optional(),
  plan: z.enum(["free", "weekly", "creator", "pro", "agency"]).optional(),
  days: z.number().int().min(0).max(3650).optional(),
  value: z.boolean().optional(),
  role: z.enum(["user", "admin"]).optional(),
  notes: z.string().max(4000).optional(),
});

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin();
    const body = schema.parse(await req.json());
    const db = adminClient();
    const { data: target } = await db.from("profiles").select("*").eq("id", body.id).maybeSingle();
    if (!target) throw new HttpError(404, "Usuário não encontrado.");
    const t = target as Profile;
    assertCanManage(actor, t);
    const tgt = { id: t.id, email: t.email };

    switch (body.action) {
      case "credits": {
        if (!body.credits) throw new HttpError(400, "Informe a quantidade.");
        const balance = await grantCredits(t.id, body.credits, "admin_adjust", body.reason || `Ajuste manual por ${actor.email}`, undefined, actor.id);
        await audit(actor, "credits.adjust", tgt, { amount: body.credits, reason: body.reason, balance });
        return Response.json({ ok: true, balance });
      }
      case "plan": {
        if (!body.plan) throw new HttpError(400, "Informe o plano.");
        const { data: plan } = await db.from("plans").select("period_days").eq("id", body.plan).single();
        const days = body.days ?? plan?.period_days ?? 30;
        const expires = body.plan === "free" ? null : new Date(Date.now() + days * 86400000).toISOString();
        const { error } = await db.from("profiles").update({ plan: body.plan, plan_expires_at: expires }).eq("id", t.id);
        if (error) throw error;
        await audit(actor, "plan.set", tgt, { plan: body.plan, days, expires });
        return Response.json({ ok: true });
      }
      case "unlimited": {
        if (isOwnerEmail(t.email) && body.value === false) throw new HttpError(403, "A conta dona é sempre ilimitada.");
        const { error } = await db.from("profiles").update({ unlimited_credits: !!body.value }).eq("id", t.id);
        if (error) throw error;
        await audit(actor, "unlimited.set", tgt, { value: !!body.value });
        return Response.json({ ok: true });
      }
      case "role": {
        if (!body.role) throw new HttpError(400, "Informe o papel.");
        if (isOwnerEmail(t.email) && body.role !== "admin") throw new HttpError(403, "A conta dona é sempre admin.");
        if (!isOwnerEmail(actor.email)) throw new HttpError(403, "Só a conta dona promove ou rebaixa admins.");
        if (t.id === actor.id) throw new HttpError(400, "Você não pode alterar o próprio papel.");
        const { error } = await db.from("profiles").update({ role: body.role }).eq("id", t.id);
        if (error) throw error;
        await audit(actor, body.role === "admin" ? "admin.promote" : "admin.demote", tgt);
        return Response.json({ ok: true });
      }
      case "ban":
      case "unban": {
        if (isOwnerEmail(t.email)) throw new HttpError(403, "A conta dona não pode ser banida.");
        if (t.id === actor.id) throw new HttpError(400, "Você não pode banir a si mesmo.");
        const ban = body.action === "ban";
        const { error } = await db.from("profiles").update({ is_banned: ban, banned_reason: ban ? body.reason ?? null : null }).eq("id", t.id);
        if (error) throw error;
        if (ban) await db.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("user_id", t.id).is("revoked_at", null);
        await audit(actor, ban ? "user.ban" : "user.unban", tgt, { reason: body.reason });
        return Response.json({ ok: true });
      }
      case "notes": {
        const { error } = await db.from("profiles").update({ admin_notes: body.notes ?? null }).eq("id", t.id);
        if (error) throw error;
        return Response.json({ ok: true });
      }
      case "revoke_keys": {
        await db.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("user_id", t.id).is("revoked_at", null);
        await audit(actor, "keys.revoke_all", tgt);
        return Response.json({ ok: true });
      }
      case "delete": {
        if (isOwnerEmail(t.email)) throw new HttpError(403, "A conta dona não pode ser excluída.");
        if (t.id === actor.id) throw new HttpError(400, "Você não pode excluir a si mesmo.");
        if (t.role === "admin" && !isOwnerEmail(actor.email)) throw new HttpError(403, "Só a conta dona exclui admins.");
        await audit(actor, "user.delete", tgt, { plan: t.plan, credits: t.credits });
        const { data: files } = await db.storage.from("carousels").list(t.id, { limit: 1000 });
        if (files?.length) {
          for (const f of files) {
            const { data: inner } = await db.storage.from("carousels").list(`${t.id}/${f.name}`, { limit: 1000 });
            if (inner?.length) await db.storage.from("carousels").remove(inner.map((x) => `${t.id}/${f.name}/${x.name}`));
          }
        }
        const { error } = await db.auth.admin.deleteUser(t.id);
        if (error) throw new HttpError(500, error.message);
        return Response.json({ ok: true });
      }
    }
  } catch (e) {
    return handleError(e);
  }
}
