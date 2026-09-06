import Link from "next/link";
import { notFound } from "next/navigation";
import { UserActions } from "@/components/admin/UserActions";
import { getUserSummary, isOwnerEmail } from "@/lib/admin";
import { formatBRL } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/supabase/server";
import type { Carousel, Plan, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UsuarioDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile: actor } = await getSession();
  const db = adminClient();
  const { data: user } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!user) notFound();
  const u = user as Profile;
  const [summary, { data: ledger }, { data: carousels }, { data: keys }, { data: payments }, { data: audit }, { data: plans }] = await Promise.all([
    getUserSummary(u.id),
    db.from("credit_transactions").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(50),
    db.from("carousels").select("id, title, template_id, status, source, credits_spent, renders, created_at").eq("user_id", u.id).order("created_at", { ascending: false }).limit(30),
    db.from("api_keys").select("id, name, key_prefix, calls, last_used_at, revoked_at, created_at").eq("user_id", u.id).order("created_at", { ascending: false }),
    db.from("payments").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(30),
    db.from("admin_audit").select("*").eq("target_id", u.id).order("created_at", { ascending: false }).limit(20),
    db.from("plans").select("*").order("sort_order"),
  ]);
  const owner = isOwnerEmail(u.email);
  const actorIsOwner = isOwnerEmail(actor?.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/usuarios" className="text-xs text-fg-3 hover:text-fg">← usuários</Link>
          <h1 className="mt-1 font-display text-2xl font-bold">{u.full_name ?? u.email}</h1>
          <div className="text-sm text-fg-2">{u.email}{u.instagram_handle ? ` · @${u.instagram_handle}` : ""} · desde {new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {owner ? <span className="pill bg-lime text-black">★ conta dona</span> : u.role === "admin" ? <span className="pill bg-violet/20 text-violet">admin</span> : null}
            {u.unlimited_credits ? <span className="pill bg-bg-3 text-lime">∞ ilimitado</span> : null}
            {u.is_banned ? <span className="pill bg-danger/20 text-danger">banido{u.banned_reason ? `: ${u.banned_reason}` : ""}</span> : null}
            <span className="pill bg-bg-3 text-fg-2">{u.plan}{u.plan_expires_at && u.plan !== "free" ? ` até ${new Date(u.plan_expires_at).toLocaleDateString("pt-BR")}` : ""}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {[["Créditos", u.unlimited_credits ? "∞" : String(u.credits)], ["Carrosséis", `${summary.carousels_ready}/${summary.carousels}`], ["Gasto", `${summary.credits_spent} cr`], ["Receita", formatBRL(summary.revenue_cents)], ["Downloads", String(summary.downloads)], ["MCP", `${summary.mcp_calls} calls`], ["Comprados", `${summary.credits_bought} cr`], ["Última ação", summary.last_event ? new Date(summary.last_event).toLocaleDateString("pt-BR") : "—"]].map(([l, v]) => (
            <div key={l} className="card px-3 py-2"><div className="text-[10px] font-bold uppercase tracking-wider text-fg-3">{l}</div><div className="font-display text-lg font-bold">{v}</div></div>
          ))}
        </div>
      </div>

      <UserActions user={u} plans={(plans as Plan[]) ?? []} isOwnerTarget={owner} actorIsOwner={actorIsOwner} isSelf={actor?.id === u.id} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-3">Carrosséis</h2>
          <div className="mt-2 divide-y divide-line">
            {(carousels as Carousel[] | null)?.map((c) => (
              <Link key={c.id} href={`/app/c/${c.id}`} className="flex items-center gap-3 py-2 text-sm hover:text-lime">
                {c.renders?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.renders[0].url} alt="" className="h-12 w-10 rounded object-cover" />
                ) : <div className="h-12 w-10 rounded bg-bg-3" />}
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{c.title}</div><div className="text-xs text-fg-3">{c.template_id} · {c.source} · {c.credits_spent} cr · {new Date(c.created_at).toLocaleString("pt-BR")}</div></div>
                <span className={`pill ${c.status === "ready" ? "bg-ok/15 text-ok" : c.status === "error" ? "bg-danger/15 text-danger" : "bg-bg-3 text-fg-2"}`}>{c.status}</span>
              </Link>
            ))}
            {!carousels?.length ? <div className="py-3 text-xs text-fg-3">Nenhum carrossel.</div> : null}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-3">Ledger de créditos</h2>
          <div className="mt-2 divide-y divide-line">
            {ledger?.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div><div className="font-semibold">{r.description ?? r.kind}</div><div className="text-xs text-fg-3">{r.kind} · {new Date(r.created_at).toLocaleString("pt-BR")} · saldo {r.balance_after}</div></div>
                <div className={`font-bold ${r.amount >= 0 ? "text-ok" : "text-danger"}`}>{r.amount >= 0 ? "+" : ""}{r.amount}</div>
              </div>
            ))}
            {!ledger?.length ? <div className="py-3 text-xs text-fg-3">Sem movimentação.</div> : null}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-3">Pagamentos</h2>
          <div className="mt-2 divide-y divide-line">
            {payments?.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div><div className="font-semibold">{p.plan_id} · {formatBRL(p.amount_cents)}</div><div className="text-xs text-fg-3">{new Date(p.created_at).toLocaleString("pt-BR")} · {p.provider_payment_id ?? p.preference_id ?? "—"}</div></div>
                <span className={`pill ${p.status === "approved" ? "bg-ok/15 text-ok" : p.status === "pending" ? "bg-bg-3 text-fg-2" : "bg-danger/15 text-danger"}`}>{p.status}</span>
              </div>
            ))}
            {!payments?.length ? <div className="py-3 text-xs text-fg-3">Nenhum pagamento.</div> : null}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg-3">Chaves API / MCP</h2>
          <div className="mt-2 divide-y divide-line">
            {keys?.map((k) => (
              <div key={k.id} className="flex items-center justify-between py-2 text-sm">
                <div><div className="font-semibold">{k.name} <span className="font-mono text-xs text-fg-3">{k.key_prefix}…</span></div><div className="text-xs text-fg-3">{k.calls} chamadas · {k.last_used_at ? new Date(k.last_used_at).toLocaleString("pt-BR") : "nunca usada"}</div></div>
                {k.revoked_at ? <span className="pill bg-danger/15 text-danger">revogada</span> : <span className="pill bg-ok/15 text-ok">ativa</span>}
              </div>
            ))}
            {!keys?.length ? <div className="py-3 text-xs text-fg-3">Nenhuma chave.</div> : null}
          </div>
          <h2 className="mt-5 text-xs font-bold uppercase tracking-wider text-fg-3">Histórico admin</h2>
          <div className="mt-2 divide-y divide-line">
            {audit?.map((a) => <div key={a.id} className="py-2 text-xs"><b>{a.actor_email}</b> <span className="text-fg-2">{a.action}</span> {a.meta ? <span className="text-fg-3">{JSON.stringify(a.meta)}</span> : null}<div className="text-fg-3">{new Date(a.created_at).toLocaleString("pt-BR")}</div></div>)}
            {!audit?.length ? <div className="py-3 text-xs text-fg-3">Nada ainda.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
