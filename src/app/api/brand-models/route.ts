import { z } from "zod";
import { handleError, requireProfile } from "@/lib/api";
import { adminClient } from "@/lib/supabase/admin";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(60),
  template_id: z.string().nullable().optional(),
  palette: z.record(z.string(), z.union([z.string(), z.array(z.string())])).nullable().optional(),
  font_display: z.string().nullable().optional(),
  font_body: z.string().nullable().optional(),
  text_scale: z.number().min(0.6).max(1.6).default(1),
  instagram_handle: z.string().max(60).nullable().optional(),
  is_default: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const body = schema.parse(await req.json());
    const db = adminClient();
    if (body.is_default) await db.from("brand_models").update({ is_default: false }).eq("user_id", profile.id);
    const row = { ...body, user_id: profile.id, instagram_handle: body.instagram_handle?.replace(/^@/, "") ?? null };
    const q = body.id ? db.from("brand_models").update(row).eq("id", body.id).eq("user_id", profile.id) : db.from("brand_models").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) throw error;
    return Response.json({ model: data });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const profile = await requireProfile();
    const { id } = z.object({ id: z.string().uuid() }).parse(await req.json());
    const db = adminClient();
    await db.from("brand_models").update({ is_default: false }).eq("user_id", profile.id);
    await db.from("brand_models").update({ is_default: true }).eq("id", id).eq("user_id", profile.id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await requireProfile();
    const { id } = z.object({ id: z.string().uuid() }).parse(await req.json());
    await adminClient().from("brand_models").delete().eq("id", id).eq("user_id", profile.id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
