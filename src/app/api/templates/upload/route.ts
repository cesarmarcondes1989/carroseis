import { handleError, HttpError, requireProfile } from "@/lib/api";
import { canEditTemplates } from "@/lib/templates/custom";
import { adminClient, publicStorageUrl } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Imagem pra camada de template (logo, foto de fundo). Vai pro Storage do usuário. */
export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    if (!canEditTemplates(profile)) throw new HttpError(402, "AGENCY_REQUIRED");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Envie uma imagem.");
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new HttpError(400, "Use PNG, JPG ou WEBP.");
    if (file.size > 8 * 1024 * 1024) throw new HttpError(400, "Imagem grande demais (máx. 8MB).");
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${profile.id}/templates/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await adminClient().storage.from("carousels").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) throw error;
    return Response.json({ url: publicStorageUrl(path), path });
  } catch (e) {
    return handleError(e);
  }
}
