import { Alert, Stat } from "@/components/ui";
import { PlanCards } from "@/components/PlanCards";
import { getDict } from "@/lib/i18n/server";
import { getSession } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Creditos({ searchParams }: { searchParams: Promise<{ pago?: string; plano?: string }> }) {
  const { t } = await getDict();
  const { supabase, profile } = await getSession();
  const { pago, plano } = await searchParams;
  const [{ data: plans }, { data: tx }] = await Promise.all([
    adminClient().from("plans").select("*").eq("active", true).neq("id", "free").order("sort_order"),
    supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(40),
  ]);
  const p = profile!;
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{t.creditsPage.title}</h1>
      {pago === "ok" ? <div className="mt-4"><Alert kind="ok">{t.creditsPage.payOk}</Alert></div> : null}
      {pago === "pendente" ? <div className="mt-4"><Alert kind="info">{t.creditsPage.payPending}</Alert></div> : null}
      {pago === "falha" ? <div className="mt-4"><Alert>{t.creditsPage.payFail}</Alert></div> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={t.app.balance} value={p.unlimited_credits ? "∞" : p.credits} sub={p.unlimited_credits ? t.app.unlimited : undefined} />
        <Stat label={t.app.plan} value={p.plan} sub={p.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString("pt-BR") : "trial"} />
        <Stat label={t.pricing.credits} value={`1 / 10`} sub="carrossel / capa IA" />
      </div>
      <h2 className="mt-10 text-lg font-bold">{t.creditsPage.buy}</h2>
      <PlanCards plans={(plans as Plan[]) ?? []} current={p.plan} highlight={plano} />
      <h2 className="mt-10 text-lg font-bold">{t.creditsPage.history}</h2>
      <div className="card mt-3 divide-y divide-line">
        {(tx ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{r.description ?? r.kind}</div>
              <div className="text-xs text-fg-3">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
            </div>
            <div className={r.amount >= 0 ? "font-bold text-ok" : "font-bold text-danger"}>{r.amount >= 0 ? "+" : ""}{r.amount}</div>
          </div>
        ))}
        {!tx?.length ? <div className="p-6 text-center text-sm text-fg-3">—</div> : null}
      </div>
    </div>
  );
}
