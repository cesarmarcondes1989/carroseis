"use client";
import { clsx } from "clsx";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Plan } from "@/lib/types";
import { Alert, formatBRL, Spinner } from "./ui";

export function PlanCards({ plans, current, highlight }: { plans: Plan[]; current: string; highlight?: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function buy(id: string) {
    setBusy(id);
    setError(null);
    const res = await fetch("/api/payments/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId: id }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.common.error);
      setBusy(null);
      return;
    }
    window.location.assign(data.url);
  }
  return (
    <div>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
      <div className="mt-3 grid gap-4 md:grid-cols-4">
        {plans.map((p) => (
          <div key={p.id} className={clsx("card relative p-5", (p.highlight || highlight === p.id) && "border-lime/60")}>
            {p.highlight ? <span className="pill absolute -top-3 left-4 bg-lime text-black">{t.pricing.popular}</span> : null}
            <div className="text-sm font-bold text-fg-2">{p.name}</div>
            <div className="mt-1 font-display text-3xl font-bold">{formatBRL(p.price_cents)}</div>
            <div className="text-xs text-fg-3">{p.period_days === 7 ? t.pricing.perWeek : t.pricing.perMonth}</div>
            <div className="mt-3 text-sm"><b className="text-lime">{p.credits}</b> {t.pricing.credits}</div>
            <div className="text-xs text-fg-2">{t.pricing.upTo.replace("{n}", String(p.credits))}</div>
            <button onClick={() => buy(p.id)} disabled={!!busy} className={clsx("btn mt-4 w-full", p.highlight ? "btn-primary" : "btn-ghost")}>
              {busy === p.id ? <Spinner /> : current === p.id ? `${t.pricing.current} · ${t.pricing.buy}` : t.pricing.buy}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-fg-3">Pagamento via Mercado Pago (Pix, cartão, boleto).</p>
    </div>
  );
}
