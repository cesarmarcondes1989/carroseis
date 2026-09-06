import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const EVENTS = ["all", "carousel.create", "carousel.render", "carousel.download", "cover.generate", "payment.approved"];

export default async function Atividade({ searchParams }: { searchParams: Promise<{ ev?: string; p?: string }> }) {
  const { ev = "all", p = "1" } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const size = 100;
  const db = adminClient();
  let q = db.from("usage_events").select("*, profiles(email, full_name)").order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
  if (ev !== "all") q = q.eq("event", ev);
  const [{ data: events }, { data: audit }] = await Promise.all([q, db.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(50)]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div>
        <h1 className="font-display text-2xl font-bold">Atividade</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {EVENTS.map((e) => <Link key={e} href={`/admin/atividade?ev=${e}`} className={`pill border ${ev === e ? "border-lime bg-lime/10 text-lime" : "border-line text-fg-2"}`}>{e === "all" ? "Tudo" : e}</Link>)}
        </div>
        <div className="card mt-4 divide-y divide-line">
          {(events ?? []).map((e) => {
            const pr = e.profiles as unknown as { email: string; full_name: string | null } | null;
            return (
              <div key={e.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  {e.user_id ? <Link href={`/admin/usuarios/${e.user_id}`} className="font-semibold hover:text-lime">{pr?.full_name ?? pr?.email ?? "?"}</Link> : <span className="font-semibold">sistema</span>}
                  <span className="ml-2 text-fg-2">{e.event}</span>
                  {e.meta ? <div className="truncate font-mono text-[11px] text-fg-3">{JSON.stringify(e.meta)}</div> : null}
                </div>
                <div className="shrink-0 text-xs text-fg-3">{new Date(e.created_at).toLocaleString("pt-BR")}</div>
              </div>
            );
          })}
          {!events?.length ? <div className="p-8 text-center text-fg-3">Nada por aqui.</div> : null}
        </div>
        <div className="mt-3 flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={`/admin/atividade?ev=${ev}&p=${page - 1}`} className="btn btn-ghost btn-sm">←</Link> : null}
          <span className="text-fg-3">página {page}</span>
          {(events?.length ?? 0) === size ? <Link href={`/admin/atividade?ev=${ev}&p=${page + 1}`} className="btn btn-ghost btn-sm">→</Link> : null}
        </div>
      </div>
      <aside>
        <h2 className="font-display text-lg font-bold">Auditoria admin</h2>
        <div className="card mt-4 divide-y divide-line">
          {(audit ?? []).map((a) => (
            <div key={a.id} className="px-4 py-2.5 text-xs">
              <b>{a.actor_email}</b> <span className="text-fg-2">{a.action}</span>
              {a.target_email ? <div className="text-fg-3">→ {a.target_email}</div> : null}
              {a.meta ? <div className="truncate font-mono text-[11px] text-fg-3">{JSON.stringify(a.meta)}</div> : null}
              <div className="text-fg-3">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
            </div>
          ))}
          {!audit?.length ? <div className="p-6 text-center text-xs text-fg-3">Nenhuma ação admin ainda.</div> : null}
        </div>
      </aside>
    </div>
  );
}
