import { getOwnedCarousel, handleError, requireProfile } from "@/lib/api";
import { rewriteScript } from "@/lib/carousel-service";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireProfile();
    const carousel = await getOwnedCarousel((await params).id, profile);
    const body = (await req.json().catch(() => ({}))) as { tone?: string };
    const updated = await rewriteScript(carousel, profile, await getLocale(), body.tone);
    return Response.json({ carousel: updated });
  } catch (e) {
    return handleError(e);
  }
}
