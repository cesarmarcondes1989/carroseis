"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan, Profile } from "@/lib/types";
import { Alert, Field, Spinner } from "@/components/ui";

export function UserActions({ user, plans, isOwnerTarget, actorIsOwner, isSelf }: { user: Profile; plans: Plan[]; isOwnerTarget: boolean; actorIsOwner: boolean; isSelf: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState(user.plan);
  const [days, setDays] = useState("");
  const [banReason, setBanReason] = useState("");
  const [notes, setNotes] = useState(user.admin_notes ?? "");

  const canManageAdmin = !user.role || user.role !== "admin" || actorIsOwner || isSelf;
  const locked = isOwnerTarget && !actorIsOwner;

  async function act(action: string, extra: Record<string, unknown> = {}, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(action);
    setMsg(null);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: user.id, action, ...extra }) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg({ kind: "error", text: data.error ?? "Erro" });
    setMsg({ kind: "ok", text: "Feito." });
    if (action === "delete") router.push("/admin/usuarios");
    else router.refresh();
  }

  if (locked) return <Alert kind="info">Esta é a conta dona. Só ela mesma pode alterar os próprios dados.</Alert>;
  if (!canManageAdmin) return <Alert kind="info">Este usuário é admin. Só a conta dona pode alterar outros admins.</Alert>;

  return (
    <div className="card p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-fg-3">Ações</div>
      {msg ? <div className="mt-3"><Alert kind={msg.kind}>{msg.text}</Alert></div> : null}
      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Field label="Créditos (+ ou -)"><input className="input" placeholder="ex.: 50 ou -10" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <input className="input" placeholder="motivo (vai pro ledger)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn btn-primary btn-sm w-full" disabled={!!busy || !Number(amount)} onClick={() => act("credits", { credits: Number(amount), reason })}>{busy === "credits" ? <Spinner /> : "Aplicar créditos"}</button>
        </div>
        <div className="space-y-2">
          <Field label="Plano">
            <select className="input" value={plan} onChange={(e) => setPlan(e.target.value as Profile["plan"])}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.period_days}d)</option>)}</select>
          </Field>
          <input className="input" placeholder="dias (vazio = padrão do plano)" value={days} onChange={(e) => setDays(e.target.value)} />
          <button className="btn btn-ghost btn-sm w-full" disabled={!!busy} onClick={() => act("plan", { plan, days: days ? Number(days) : undefined })}>{busy === "plan" ? <Spinner /> : "Definir plano"}</button>
        </div>
        <div className="space-y-2">
          <Field label="Privilégios">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-lime" checked={user.unlimited_credits} disabled={isOwnerTarget} onChange={(e) => act("unlimited", { value: e.target.checked })} /> Créditos ilimitados</label>
          </Field>
          {actorIsOwner && !isSelf ? (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-lime" checked={user.role === "admin"} disabled={isOwnerTarget} onChange={(e) => act("role", { role: e.target.checked ? "admin" : "user" }, e.target.checked ? `Promover ${user.email} a admin?` : `Rebaixar ${user.email}?`)} /> Admin</label>
          ) : <div className="text-xs text-fg-3">Só a conta dona promove admins.</div>}
          <button className="btn btn-ghost btn-sm w-full" disabled={!!busy} onClick={() => act("revoke_keys", {}, "Revogar todas as chaves API deste usuário?")}>Revogar chaves API</button>
        </div>
        <div className="space-y-2">
          <Field label="Zona de perigo">
            {user.is_banned ? (
              <button className="btn btn-ghost btn-sm w-full" disabled={!!busy || isOwnerTarget || isSelf} onClick={() => act("unban")}>Reativar conta</button>
            ) : (
              <>
                <input className="input" placeholder="motivo do banimento" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
                <button className="btn btn-danger btn-sm mt-2 w-full" disabled={!!busy || isOwnerTarget || isSelf} onClick={() => act("ban", { reason: banReason }, `Banir ${user.email}? Ela perde acesso e as chaves MCP são revogadas.`)}>Banir</button>
              </>
            )}
          </Field>
          <button className="btn btn-danger btn-sm w-full" disabled={!!busy || isOwnerTarget || isSelf} onClick={() => act("delete", {}, `EXCLUIR ${user.email} de vez? Apaga conta, carrosséis e arquivos. Não tem volta.`)}>{busy === "delete" ? <Spinner /> : "Excluir conta"}</button>
        </div>
      </div>
      <div className="mt-4">
        <Field label="Notas internas (só admins veem)">
          <textarea className="input min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (user.admin_notes ?? "") && act("notes", { notes })} />
        </Field>
      </div>
    </div>
  );
}
