import JSZip from "jszip";
import { getOwnedCarousel, handleError, HttpError, requireProfile } from "@/lib/api";
import { planActive, logUsage } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET: ZIP com os PNGs. Exige plano ativo (ou conta ilimitada/admin). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireProfile();
    if (!planActive(profile)) throw new HttpError(402, "PLAN_REQUIRED");
    const carousel = await getOwnedCarousel((await params).id, profile);
    if (!carousel.renders?.length) throw new HttpError(400, "Pinte os PNGs primeiro.");
    const zip = new JSZip();
    for (const r of carousel.renders) {
      const res = await fetch(r.url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Falha ao baixar o card ${r.index + 1}`);
      zip.file(`${String(r.index + 1).padStart(2, "0")}.png`, await res.arrayBuffer());
    }
    if (carousel.caption) zip.file("legenda.txt", `${carousel.caption}\n\n${(carousel.hashtags ?? []).map((h) => `#${h}`).join(" ")}`);
    const buf = await zip.generateAsync({ type: "arraybuffer", compression: "STORE" });
    await logUsage(profile.id, "carousel.download", { carousel: carousel.id });
    const name = carousel.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "carrossel";
    return new Response(buf, { headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${name}.zip"` } });
  } catch (e) {
    return handleError(e);
  }
}
