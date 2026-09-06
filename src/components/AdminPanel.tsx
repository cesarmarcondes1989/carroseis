"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Profile } from "@/lib/types";
import { Alert, formatBRL, Spinner } from "./ui";

type Payment = { id: string; status: string; amount_cents: number; plan_id: string; created_at: string; profiles: { email: string } | null };

export function AdminPanel({ users, payments, query }: { users: Profile[]; payments: Payment[]; query: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});

  async function post(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) setError((await res.json()).error ?? t.common.error);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-10">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t.admin.users}</h2>
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/admin?q=${encodeURIComponent(q)}`); }}>
            <input className="input w-64" placeholder="email ou nome" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
        </div>
        {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-fg-3">
              <tr><th className="p-3">Usuário</th><th className="p-3">Plano</th><th className="p-3">Créditos</th><th className="p-3">{t.admin.adjust}</th><th className="p-3">Flags</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3">
                    <div className="font-bold">{u.full_name ?? "—"}</div>
                    <div className="text-xs text-fg-3">{u.email} · {new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
                  </td>
                  <td className="p-3">
                    <select className="input py-1" value={u.plan} onChange={(e) => post({ id: u.id, plan: e.target.value }, u.id + "plan")}>
                      {["free", "weekly", "creator", "pro", "agency"].map((p) => <option key={p}>{p}</option>)}
                    </select>
                    <div className="text-xs text-fg-3">{u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString("pt-BR") : "—"}</div>
                  </td>
                  <td className="p-3 font-display text-xl font-bold">{u.unlimited_credits ? "∞" : u.credits}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <input className="input w-20 py-1" placeholder="±n" value={amount[u.id] ?? ""} onChange={(e) => setAmount({ ...amount, [u.id]: e.target.value })} />
                      <input className="input w-36 py-1" placeholder={t.admin.reason} value={reason[u.id] ?? ""} onChange={(e) => setReason({ ...reason, [u.id]: e.target.value })} />
                      <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => post({ id: u.id, credits: Number(amount[u.id]), reason: reason[u.id] }, u.id)}>{busy === u.id ? <Spinner /> : t.admin.apply}</button>
                    </div>
                  </td>
                  <td className="p-3">
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={u.unlimited_credits} onChange={(e) => post({ id: u.id, unlimited_credits: e.target.checked }, u.id + "u")} className="accent-lime" /> {t.admin.toggleUnlimited}</label>
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={u.role === "admin"} onChange={(e) => post({ id: u.id, role: e.target.checked ? "admin" : "user" }, u.id + "r")} className="accent-lime" /> {t.admin.toggleAdmin}</label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">{t.admin.payments}</h2>
        <div className="card mt-3 divide-y divide-line">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-bold">{p.profiles?.email ?? "—"} · {p.plan_id}</div>
                <div className="text-xs text-fg-3">{new Date(p.created_at).toLocaleString("pt-BR")}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatBRL(p.amount_cents)}</div>
                <div className={`text-xs ${p.status === "approved" ? "text-ok" : p.status === "pending" ? "text-fg-2" : "text-danger"}`}>{p.status}</div>
              </div>
            </div>
          ))}
          {!payments.length ? <div className="p-6 text-center text-sm text-fg-3">—</div> : null}
        </div>
      </section>
    </div>
  );
}
