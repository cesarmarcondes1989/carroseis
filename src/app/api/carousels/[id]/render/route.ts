import { getOwnedCarousel, handleError, requireProfile } from "@/lib/api";
import { renderCarousel } from "@/lib/carousel-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    if (!carousel.slides?.length) return Response.json({ error: "Sem cards pra pintar." }, { status: 400 });
    const rendered = await renderCarousel(carousel, profile);
    return Response.json({ carousel: rendered });
  } catch (e) {
    return handleError(e);
  }
}
