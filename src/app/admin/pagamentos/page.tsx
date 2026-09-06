import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const STATUSES = ["all", "approved", "pending", "rejected", "cancelled", "refunded"];

export default async function Pagamentos({ searchParams }: { searchParams: Promise<{ st?: string; p?: string }> }) {
  const { st = "all", p = "1" } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const size = 50;
  const db = adminClient();
  let q = db.from("payments").select("*, profiles(email, full_name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
  if (st !== "all") q = q.eq("status", st);
  const [{ data, count }, { data: totals }] = await Promise.all([q, db.from("payments").select("status, amount_cents")]);
  const sum = (s: string) => (totals ?? []).filter((x) => x.status === s).reduce((a, x) => a + x.amount_cents, 0);
  const cnt = (s: string) => (totals ?? []).filter((x) => x.status === s).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Pagamentos</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[["Aprovados", formatBRL(sum("approved")), `${cnt("approved")} pagamentos`], ["Pendentes", formatBRL(sum("pending")), `${cnt("pending")} aguardando`], ["Recusados", formatBRL(sum("rejected") + sum("cancelled")), `${cnt("rejected") + cnt("cancelled")}`], ["Estornados", formatBRL(sum("refunded")), `${cnt("refunded")}`]].map(([l, v, s]) => (
          <div key={l} className="card p-4"><div className="text-xs font-bold uppercase tracking-wider text-fg-3">{l}</div><div className="font-display text-2xl font-bold">{v}</div><div className="text-xs text-fg-3">{s}</div></div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => <Link key={s} href={`/admin/pagamentos?st=${s}`} className={`pill border ${st === s ? "border-lime bg-lime/10 text-lime" : "border-line text-fg-2"}`}>{s === "all" ? "Todos" : s}</Link>)}
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-fg-3"><tr><th className="p-3">Quando</th><th className="p-3">Usuário</th><th className="p-3">Plano</th><th className="p-3">Valor</th><th className="p-3">Status</th><th className="p-3">Créditos</th><th className="p-3">MP</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((r) => {
              const pr = r.profiles as unknown as { email: string; full_name: string | null } | null;
              return (
                <tr key={r.id}>
                  <td className="p-3 text-xs text-fg-2">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3"><Link href={`/admin/usuarios/${r.user_id}`} className="font-semibold hover:text-lime">{pr?.full_name ?? pr?.email ?? r.user_id}</Link><div className="text-xs text-fg-3">{pr?.email}</div></td>
                  <td className="p-3">{r.plan_id}</td>
                  <td className="p-3 font-bold">{formatBRL(r.amount_cents)}</td>
                  <td className="p-3"><span className={`pill ${r.status === "approved" ? "bg-ok/15 text-ok" : r.status === "pending" ? "bg-bg-3 text-fg-2" : "bg-danger/15 text-danger"}`}>{r.status}</span></td>
                  <td className="p-3">{r.credits_granted}</td>
                  <td className="p-3 font-mono text-xs text-fg-3">{r.provider_payment_id ?? "—"}</td>
                </tr>
              );
            })}
            {!data?.length ? <tr><td colSpan={7} className="p-8 text-center text-fg-3">Nenhum pagamento.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-fg-3">{count ?? 0} registros</div>
    </div>
  );
}
