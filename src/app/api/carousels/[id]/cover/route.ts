import { getOwnedCarousel, handleError, HttpError, requireProfile } from "@/lib/api";
import { generateCover } from "@/lib/carousel-service";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;
type Ctx = { params: Promise<{ id: string }> };

/** POST: gera a capa por IA (10 créditos). Body opcional: { scene } */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    const body = (await req.json().catch(() => ({}))) as { scene?: string };
    const updated = await generateCover(carousel, profile, body.scene);
    return Response.json({ carousel: updated });
  } catch (e) {
    return handleError(e);
  }
}

/** PUT multipart: sobe a foto própria da capa. Grátis. */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Envie uma imagem.");
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new HttpError(400, "Use PNG, JPG ou WEBP.");
    if (file.size > 12 * 1024 * 1024) throw new HttpError(400, "Imagem grande demais (máx. 12MB).");
    const db = adminClient();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${carousel.user_id}/${carousel.id}/cover-own-${Date.now()}.${ext}`;
    const { error } = await db.storage.from("carousels").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data } = await db.from("carousels").update({ cover_image_path: path, cover_mode: "own", renders: [], status: "draft" }).eq("id", carousel.id).select("*").single();
    return Response.json({ carousel: data });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE: remove a capa. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    const { data } = await adminClient().from("carousels").update({ cover_image_path: null, cover_mode: "none", renders: [], status: "draft" }).eq("id", carousel.id).select("*").single();
    return Response.json({ carousel: data });
  } catch (e) {
    return handleError(e);
  }
}
