import { z } from "zod";
import { handleError, HttpError } from "@/lib/api";
import { audit, isOwnerEmail, requireOwner } from "@/lib/admin";
import { adminClient } from "@/lib/supabase/admin";

/** Só a conta dona promove ou rebaixa admins. */
export async function POST(req: Request) {
  try {
    const owner = await requireOwner();
    const { email, role } = z.object({ email: z.string().email(), role: z.enum(["admin", "user"]) }).parse(await req.json());
    const db = adminClient();
    const { data: target } = await db.from("profiles").select("id, email, role").ilike("email", email).maybeSingle();
    if (!target) throw new HttpError(404, "Esse email ainda não tem conta. A pessoa precisa se cadastrar primeiro.");
    if (isOwnerEmail(target.email) && role !== "admin") throw new HttpError(403, "A conta dona é sempre admin.");
    if (target.id === owner.id) throw new HttpError(400, "Você já é a conta dona.");
    const { error } = await db.from("profiles").update({ role }).eq("id", target.id);
    if (error) throw error;
    await audit(owner, role === "admin" ? "admin.promote" : "admin.demote", target);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
