import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/admin";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Novos (7d)" },
  { id: "paying", label: "Pagantes" },
  { id: "free", label: "Grátis" },
  { id: "active", label: "Ativos (7d)" },
  { id: "admins", label: "Admins" },
  { id: "banned", label: "Banidos" },
];

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; p?: string; s?: string }> }) {
  const { q = "", f = "all", p = "1", s = "created" } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const size = 50;
  const db = adminClient();
  let query = db.from("profiles").select("*", { count: "exact" });
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,instagram_handle.ilike.%${q}%`);
  const week = new Date(new Date().getTime() - 7 * 86400000).toISOString();
  if (f === "new") query = query.gte("created_at", week);
  if (f === "paying") query = query.neq("plan", "free").gt("plan_expires_at", new Date().toISOString());
  if (f === "free") query = query.eq("plan", "free");
  if (f === "active") query = query.gte("last_active_at", week);
  if (f === "admins") query = query.eq("role", "admin");
  if (f === "banned") query = query.eq("is_banned", true);
  const orderCol = s === "credits" ? "credits" : s === "active" ? "last_active_at" : "created_at";
  query = query.order(orderCol, { ascending: false, nullsFirst: false }).range((page - 1) * size, page * size - 1);
  const { data, count } = await query;
  const users = (data as Profile[]) ?? [];
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  const link = (over: Record<string, string>) => `/admin/usuarios?${new URLSearchParams({ q, f, s, p: String(page), ...over }).toString()}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Usuários <span className="text-base font-normal text-fg-3">{count ?? 0}</span></h1>
        <form className="flex gap-2">
          <input type="hidden" name="f" value={f} />
          <input name="q" defaultValue={q} className="input w-72" placeholder="email, nome ou @" />
          <button className="btn btn-primary btn-sm">Buscar</button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => <Link key={x.id} href={link({ f: x.id, p: "1" })} className={`pill border ${f === x.id ? "border-lime bg-lime/10 text-lime" : "border-line text-fg-2"}`}>{x.label}</Link>)}
        <span className="ml-auto flex gap-1 text-xs text-fg-3">ordenar:
          {[["created", "cadastro"], ["active", "atividade"], ["credits", "créditos"]].map(([k, l]) => <Link key={k} href={link({ s: k })} className={s === k ? "text-fg" : ""}>{l}</Link>)}
        </span>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-fg-3">
            <tr><th className="p-3">Usuário</th><th className="p-3">Plano</th><th className="p-3">Créditos</th><th className="p-3">Cadastro</th><th className="p-3">Última atividade</th><th className="p-3">Flags</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-bg-3/40">
                <td className="p-3">
                  <Link href={`/admin/usuarios/${u.id}`} className="font-bold hover:text-lime">{u.full_name ?? "—"}</Link>
                  <div className="text-xs text-fg-3">{u.email}{u.instagram_handle ? ` · @${u.instagram_handle}` : ""}</div>
                </td>
                <td className="p-3"><span className="pill bg-bg-3 text-fg-2">{u.plan}</span><div className="text-xs text-fg-3">{u.plan_expires_at && u.plan !== "free" ? `até ${new Date(u.plan_expires_at).toLocaleDateString("pt-BR")}` : ""}</div></td>
                <td className="p-3 font-display text-lg font-bold">{u.unlimited_credits ? "∞" : u.credits}</td>
                <td className="p-3 text-xs text-fg-2">{new Date(u.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-3 text-xs text-fg-2">{u.last_active_at ? new Date(u.last_active_at).toLocaleString("pt-BR") : "—"}</td>
                <td className="p-3 text-xs">
                  {isOwnerEmail(u.email) ? <span className="pill bg-lime text-black">dona</span> : u.role === "admin" ? <span className="pill bg-violet/20 text-violet">admin</span> : null}
                  {u.is_banned ? <span className="pill ml-1 bg-danger/20 text-danger">banido</span> : null}
                </td>
              </tr>
            ))}
            {users.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-fg-3">Ninguém aqui com esse filtro.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm">
          {page > 1 ? <Link href={link({ p: String(page - 1) })} className="btn btn-ghost btn-sm">←</Link> : null}
          <span className="text-fg-3">{page} / {pages}</span>
          {page < pages ? <Link href={link({ p: String(page + 1) })} className="btn btn-ghost btn-sm">→</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
