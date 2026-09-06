import "server-only";
import { createHmac } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { adminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/carousel-service";
import { logUsage } from "@/lib/credits";
import type { Plan, Profile } from "@/lib/types";

function mp() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
}

/** Cria a preferência de Checkout Pro e o registro de pagamento pendente. Devolve a URL de checkout. */
export async function createCheckout(profile: Profile, plan: Plan) {
  const db = adminClient();
  const { data: payment, error } = await db
    .from("payments")
    .insert({ user_id: profile.id, plan_id: plan.id, amount_cents: plan.price_cents, status: "pending" })
    .select("*")
    .single();
  if (error) throw error;

  const pref = await new Preference(mp()).create({
    body: {
      items: [{ id: plan.id, title: `Desliza IA · Plano ${plan.name} (${plan.credits} créditos)`, quantity: 1, unit_price: plan.price_cents / 100, currency_id: "BRL" }],
      payer: { email: profile.email, name: profile.full_name ?? undefined },
      external_reference: payment.id,
      metadata: { payment_id: payment.id, user_id: profile.id, plan_id: plan.id },
      back_urls: { success: appUrl("/app/creditos?pago=ok"), pending: appUrl("/app/creditos?pago=pendente"), failure: appUrl("/app/creditos?pago=falha") },
      auto_return: "approved",
      notification_url: appUrl("/api/webhooks/mercadopago"),
      statement_descriptor: "DESLIZAIA",
    },
  });
  await db.from("payments").update({ preference_id: pref.id }).eq("id", payment.id);
  const url = process.env.MERCADOPAGO_SANDBOX === "true" ? pref.sandbox_init_point : pref.init_point;
  if (!url) throw new Error("Mercado Pago não devolveu a URL de checkout.");
  return { url, paymentId: payment.id as string };
}

/** Valida a assinatura x-signature do webhook (HMAC SHA256). */
export function verifySignature(req: Request, dataId: string | null) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // sem segredo configurado: aceita (configure em produção!)
  const sig = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=") as [string, string]));
  const ts = parts.ts, v1 = parts.v1;
  if (!ts || !v1) return false;
  const manifest = `${dataId ? `id:${dataId.toLowerCase()};` : ""}request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === v1;
}

/** Busca o pagamento no MP e, se aprovado, aplica o plano (idempotente). */
export async function reconcilePayment(mpPaymentId: string) {
  const db = adminClient();
  const info = await new Payment(mp()).get({ id: mpPaymentId });
  const ref = info.external_reference ?? (info.metadata as { payment_id?: string } | undefined)?.payment_id;
  if (!ref) return { ok: false, reason: "sem external_reference" };
  const { data: payment } = await db.from("payments").select("*").eq("id", ref).maybeSingle();
  if (!payment) return { ok: false, reason: "pagamento não encontrado" };

  const status = info.status === "approved" ? "approved" : info.status === "rejected" ? "rejected" : info.status === "cancelled" ? "cancelled" : info.status === "refunded" || info.status === "charged_back" ? "refunded" : "pending";
  if (payment.status === "approved") return { ok: true, already: true };

  await db.from("payments").update({ status, provider_payment_id: String(info.id), raw: info as unknown as Record<string, unknown> }).eq("id", payment.id);
  if (status === "approved") {
    const { data: plan } = await db.from("plans").select("*").eq("id", payment.plan_id).single();
    const { error } = await db.rpc("apply_plan", { p_user: payment.user_id, p_plan: payment.plan_id, p_payment: payment.id });
    if (error) throw error;
    await db.from("payments").update({ credits_granted: plan?.credits ?? 0 }).eq("id", payment.id);
    await logUsage(payment.user_id, "payment.approved", { plan: payment.plan_id, amount: payment.amount_cents });
  }
  return { ok: true, status };
}
