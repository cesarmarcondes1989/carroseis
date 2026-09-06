import { z } from "zod";
import { getOwnedCarousel, handleError, requireProfile } from "@/lib/api";
import { adminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  title: z.string().max(120).optional(),
  template_id: z.string().optional(),
  aspect: z.enum(["4:5", "1:1"]).optional(),
  slides: z.array(z.object({ titulo: z.string().max(200), texto: z.string().max(600).optional(), etiqueta: z.string().max(40).optional() })).min(1).max(10).optional(),
  brand_overrides: z
    .object({
      palette: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
      font_display: z.string().nullable().optional(),
      font_body: z.string().nullable().optional(),
      text_scale: z.number().min(0.6).max(1.6).optional(),
      instagram_handle: z.string().nullable().optional(),
      variant: z.enum(["dark", "light"]).optional(),
    })
    .nullable()
    .optional(),
  instagram_handle: z.string().max(60).nullable().optional(),
  cover_scene: z.string().max(600).nullable().optional(),
  cover_mode: z.enum(["ai", "own", "none"]).optional(),
  caption: z.string().max(3000).nullable().optional(),
  seamless: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    return Response.json({ carousel });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    const body = patch.parse(await req.json());
    const changesArt = body.slides || body.template_id || body.aspect || body.brand_overrides !== undefined || body.instagram_handle !== undefined || body.cover_mode || body.seamless !== undefined;
    const { data, error } = await adminClient()
      .from("carousels")
      .update({ ...body, ...(changesArt ? { renders: [], status: carousel.status === "ready" ? "draft" : carousel.status } : {}) })
      .eq("id", carousel.id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ carousel: data });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    const db = adminClient();
    const { data: files } = await db.storage.from("carousels").list(`${carousel.user_id}/${carousel.id}`);
    if (files?.length) await db.storage.from("carousels").remove(files.map((f) => `${carousel.user_id}/${carousel.id}/${f.name}`));
    await db.from("carousels").delete().eq("id", carousel.id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
