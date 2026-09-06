import { z } from "zod";
import { handleError, requireProfile } from "@/lib/api";
import { generateKey } from "@/lib/api-keys";
import { adminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/carousel-service";

export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const { name } = z.object({ name: z.string().max(60).default("Claude") }).parse(await req.json().catch(() => ({})));
    const { key, hash, prefix } = generateKey();
    const { data, error } = await adminClient().from("api_keys").insert({ user_id: profile.id, name: name || "Claude", key_hash: hash, key_prefix: prefix }).select("id, name, key_prefix, created_at").single();
    if (error) throw error;
    return Response.json({ key, url: appUrl(`/api/mcp/${key}`), record: data });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await requireProfile();
    const { id } = z.object({ id: z.string().uuid() }).parse(await req.json());
    await adminClient().from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("user_id", profile.id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
