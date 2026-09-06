import { getOwnedCarousel, handleError, HttpError, requireProfile } from "@/lib/api";
import { logUsage, planActive } from "@/lib/credits";

export const runtime = "nodejs";

/**
 * Serve um card como PNG no mesmo domínio, com nome de arquivo e disposição de
 * download. Necessário porque o atributo download e a Web Share API não
 * funcionam bem com URLs de outro domínio (o Storage). Exige plano, igual ao ZIP.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  try {
    const profile = await requireProfile();
    if (!planActive(profile)) throw new HttpError(402, "PLAN_REQUIRED");
    const { id, n } = await params;
    const carousel = await getOwnedCarousel(id, profile);
    const index = Number(n) - 1;
    const render = carousel.renders?.find((r) => r.index === index);
    if (!render) throw new HttpError(404, "Card não encontrado. Pinte os PNGs primeiro.");
    const res = await fetch(render.url, { cache: "no-store" });
    if (!res.ok) throw new HttpError(502, "Falha ao ler o card.");
    const inline = new URL(req.url).searchParams.get("inline") === "1";
    if (index === 0) await logUsage(profile.id, "carousel.download", { carousel: carousel.id, mode: "slide" });
    const name = `${carousel.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "carrossel"}-${String(index + 1).padStart(2, "0")}.png`;
    return new Response(res.body, {
      headers: {
        "content-type": "image/png",
        "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
        // Sem cache: o mesmo /slide/N pode virar outra imagem (regerou com outro template).
        // Cachear por URL fazia o navegador entregar o PNG antigo depois de trocar o template.
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
