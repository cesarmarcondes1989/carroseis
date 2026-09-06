"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Spinner } from "@/components/ui";

type Admin = { id: string; email: string; full_name: string | null; created_at: string; last_active_at: string | null; owner: boolean };

export function AdminsManager({ admins, actorIsOwner, ownerEmails }: { admins: Admin[]; actorIsOwner: boolean; ownerEmails: string[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function set(target: string, role: "admin" | "user") {
    if (role === "user" && !confirm(`Rebaixar ${target}?`)) return;
    setBusy(target);
    setMsg(null);
    const res = await fetch("/api/admin/admins", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: target, role }) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg({ kind: "error", text: data.error ?? "Erro" });
    setMsg({ kind: "ok", text: role === "admin" ? `${target} agora é admin.` : `${target} voltou a ser usuário comum.` });
    setEmail("");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold">Admins</h1>
      <p className="mt-1 text-sm text-fg-2">Admins veem tudo, ajustam créditos, planos, banem e excluem usuários comuns. Só a <b>conta dona</b> ({ownerEmails.join(", ")}) promove ou rebaixa admins, e ninguém, nem outro admin, consegue excluir, rebaixar, banir ou tirar o ilimitado dela: o próprio banco bloqueia.</p>
      {msg ? <div className="mt-4"><Alert kind={msg.kind}>{msg.text}</Alert></div> : null}
      {actorIsOwner ? (
        <div className="card mt-6 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-fg-3">Promover a admin</div>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (email) set(email.trim().toLowerCase(), "admin"); }}>
            <input className="input" type="email" placeholder="email de alguém que já tem conta" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-primary" disabled={!!busy || !email}>{busy === email ? <Spinner /> : "Promover"}</button>
          </form>
        </div>
      ) : <div className="mt-6"><Alert kind="info">Você é admin, mas só a conta dona adiciona ou remove admins.</Alert></div>}
      <div className="card mt-4 divide-y divide-line">
        {admins.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div>
              <div className="font-bold">{a.full_name ?? a.email} {a.owner ? <span className="pill ml-1 bg-lime text-black">★ dona</span> : <span className="pill ml-1 bg-violet/20 text-violet">admin</span>}</div>
              <div className="text-xs text-fg-3">{a.email} · desde {new Date(a.created_at).toLocaleDateString("pt-BR")}{a.last_active_at ? ` · ativo ${new Date(a.last_active_at).toLocaleDateString("pt-BR")}` : ""}</div>
            </div>
            {actorIsOwner && !a.owner ? <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => set(a.email, "user")}>Rebaixar</button> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
