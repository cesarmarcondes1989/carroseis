"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Spinner } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import type { Plan, Template } from "@/lib/types";

export function CatalogEditor({ plans, templates }: { plans: Plan[]; templates: Template[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [edit, setEdit] = useState<Record<string, Partial<Plan>>>({});

  async function save(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setMsg(null);
    const res = await fetch("/api/admin/catalog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg({ kind: "error", text: data.error ?? "Erro" });
    setMsg({ kind: "ok", text: "Salvo." });
    setEdit((e) => ({ ...e, [key]: {} }));
    router.refresh();
  }
  const val = <K extends keyof Plan>(p: Plan, k: K) => (edit[p.id]?.[k] ?? p[k]) as Plan[K];
  const setVal = (id: string, k: keyof Plan, v: unknown) => setEdit((e) => ({ ...e, [id]: { ...(e[id] ?? {}), [k]: v } }));

  return (
    <div className="space-y-10">
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}
      <section>
        <h1 className="font-display text-2xl font-bold">Planos</h1>
        <p className="mt-1 text-sm text-fg-2">Preço em centavos (R$9,90 = 990). Vale na hora pra landing, checkout e créditos concedidos.</p>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-fg-3"><tr><th className="p-3">Plano</th><th className="p-3">Nome</th><th className="p-3">Preço (centavos)</th><th className="p-3">Créditos</th><th className="p-3">Dias</th><th className="p-3">Destaque</th><th className="p-3">Ativo</th><th className="p-3"></th></tr></thead>
            <tbody className="divide-y divide-line">
              {plans.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-mono text-xs">{p.id}</td>
                  <td className="p-3"><input className="input w-32 py-1" value={val(p, "name")} onChange={(e) => setVal(p.id, "name", e.target.value)} /></td>
                  <td className="p-3"><input className="input w-28 py-1" type="number" value={val(p, "price_cents")} onChange={(e) => setVal(p.id, "price_cents", Number(e.target.value))} /><div className="text-xs text-fg-3">{formatBRL(Number(val(p, "price_cents")))}</div></td>
                  <td className="p-3"><input className="input w-24 py-1" type="number" value={val(p, "credits")} onChange={(e) => setVal(p.id, "credits", Number(e.target.value))} /></td>
                  <td className="p-3"><input className="input w-20 py-1" type="number" value={val(p, "period_days")} onChange={(e) => setVal(p.id, "period_days", Number(e.target.value))} /></td>
                  <td className="p-3"><input type="checkbox" className="accent-lime" checked={!!val(p, "highlight")} onChange={(e) => setVal(p.id, "highlight", e.target.checked)} /></td>
                  <td className="p-3"><input type="checkbox" className="accent-lime" checked={!!val(p, "active")} onChange={(e) => setVal(p.id, "active", e.target.checked)} /></td>
                  <td className="p-3"><button className="btn btn-primary btn-sm" disabled={!!busy || !edit[p.id] || !Object.keys(edit[p.id]).length} onClick={() => save({ kind: "plan", id: p.id, ...edit[p.id] }, p.id)}>{busy === p.id ? <Spinner /> : "Salvar"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold">Templates</h2>
        <p className="mt-1 text-sm text-fg-2">Desativar tira o template da landing, do criador e do MCP. Nome e descrição alimentam o que o Claude lê.</p>
        <div className="card mt-4 divide-y divide-line">
          {templates.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-lime" checked={t.active !== false} onChange={(e) => save({ kind: "template", id: t.id, active: e.target.checked }, t.id)} /></label>
              <span className="w-36 font-mono text-xs text-fg-3">{t.id}</span>
              <input className="input w-48 py-1" defaultValue={t.name} onBlur={(e) => e.target.value !== t.name && save({ kind: "template", id: t.id, name: e.target.value }, t.id)} />
              <input className="input min-w-64 flex-1 py-1" defaultValue={t.description} onBlur={(e) => e.target.value !== t.description && save({ kind: "template", id: t.id, description: e.target.value }, t.id)} />
              <span className="pill bg-bg-3 text-fg-3">{t.layout}</span>
              {busy === t.id ? <Spinner /> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
