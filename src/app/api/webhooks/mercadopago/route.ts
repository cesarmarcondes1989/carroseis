import { reconcilePayment, verifySignature } from "@/lib/payments/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago. Configure em Suas integrações > Webhooks apontando para
 * https://SEU-DOMINIO/api/webhooks/mercadopago com o evento "Pagamentos".
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await req.json();
  } catch {
    /* MP às vezes manda só query string */
  }
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  if (!verifySignature(req, dataId || null)) {
    return Response.json({ error: "assinatura inválida" }, { status: 401 });
  }
  if (type !== "payment" || !dataId) return Response.json({ ignored: true });

  try {
    const result = await reconcilePayment(dataId);
    return Response.json(result);
  } catch (e) {
    console.error("webhook mercadopago", e);
    return Response.json({ error: e instanceof Error ? e.message : "erro" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true });
}
