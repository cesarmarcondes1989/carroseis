import Link from "next/link";
import { Bars, Kpi, LineChart, SERIES } from "@/components/admin/Charts";
import { pct } from "@/lib/pct";
import { getAdminStats } from "@/lib/admin";
import { formatBRL } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = { topic: "Tema", url: "Link", youtube: "YouTube", pdf: "PDF", script: "Roteiro próprio", mcp: "MCP (Claude)" };
const EVENT_LABEL: Record<string, string> = { "carousel.create": "criou carrossel", "carousel.render": "pintou PNGs", "carousel.download": "baixou ZIP", "cover.generate": "gerou capa por IA", "payment.approved": "pagamento aprovado", "admin.user_update": "ajuste admin" };

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias } = await searchParams;
  const days = Math.min(90, Math.max(7, Number(dias) || 30));
  const db = adminClient();
  const [stats, { data: events }, { data: audit }, { data: newUsers }] = await Promise.all([
    getAdminStats(days),
    db.from("usage_events").select("id, event, meta, created_at, profiles(email, full_name)").order("created_at", { ascending: false }).limit(25),
    db.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(10),
    db.from("profiles").select("id, email, full_name, plan, credits, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const t = stats.totals;
  const d = stats.daily;
  const labels = d.map((p) => new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
  const sum = (k: keyof (typeof d)[number]) => d.reduce((s, p) => s + Number(p[k]), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Visão geral</h1>
        <div className="flex gap-1 text-xs">
          {[7, 30, 90].map((n) => <Link key={n} href={`/admin?dias=${n}`} className={`rounded-lg px-3 py-1.5 font-semibold ${days === n ? "bg-bg-3 text-fg" : "text-fg-2"}`}>{n} dias</Link>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Usuários" value={String(t.users)} delta={pct(t.users_7d, t.users_prev_7d)} deltaLabel={`vs 7 dias antes (${t.users_7d} novos)`} trend={d.map((p) => p.signups)} color={SERIES[0]} />
        <Kpi label="Carrosséis" value={String(t.carousels)} delta={pct(t.carousels_7d, t.carousels_prev_7d)} deltaLabel={`vs 7 dias antes (${t.carousels_7d} na semana)`} trend={d.map((p) => p.carousels)} color={SERIES[1]} />
        <Kpi label="Receita (30d)" value={formatBRL(t.revenue_30d_cents)} delta={pct(t.revenue_30d_cents, t.revenue_prev_30d_cents)} deltaLabel={`vs 30 dias antes · total ${formatBRL(t.revenue_cents)}`} trend={d.map((p) => p.revenue_cents)} color={SERIES[2]} />
        <Kpi label="Pagantes ativos" value={String(t.paying)} hint={`${t.payments_pending} pagamentos pendentes`} trend={d.map((p) => p.payments)} color={SERIES[3]} />
        <Kpi label="Ativos (7d / 30d)" value={`${t.active_7d} / ${t.active_30d}`} hint="usuários com alguma ação" trend={d.map((p) => p.active_users)} color={SERIES[0]} />
        <Kpi label="Créditos em circulação" value={String(t.credits_circulating)} hint={`${t.credits_consumed_7d} consumidos em 7 dias`} trend={d.map((p) => p.credits)} color={SERIES[1]} />
        <Kpi label="Capas por IA" value={String(t.ai_covers_total)} hint={`${sum("ai_covers")} no período`} trend={d.map((p) => p.ai_covers)} color={SERIES[2]} />
        <Kpi label="MCP" value={`${t.api_keys_active} chaves`} hint={`${t.mcp_calls} chamadas · ${sum("mcp")} carrosséis via Claude no período`} trend={d.map((p) => p.mcp)} color={SERIES[3]} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5"><LineChart title="Cadastros e usuários ativos por dia" labels={labels} series={[{ name: "Cadastros", values: d.map((p) => p.signups) }, { name: "Ativos", values: d.map((p) => p.active_users) }]} /></div>
        <div className="card p-5"><LineChart title="Carrosséis por dia: app vs Claude (MCP)" labels={labels} series={[{ name: "Total", values: d.map((p) => p.carousels) }, { name: "Via MCP", values: d.map((p) => p.mcp) }]} /></div>
        <div className="card p-5"><LineChart title="Créditos consumidos por dia" labels={labels} series={[{ name: "Créditos", values: d.map((p) => p.credits), color: SERIES[1] }]} /></div>
        <div className="card p-5"><LineChart title="Receita por dia" labels={labels} series={[{ name: "Receita", values: d.map((p) => p.revenue_cents / 100), color: SERIES[2] }]} format="currency" /></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><Bars title="Templates mais usados" items={stats.breakdowns.templates.slice(0, 8).map((x) => ({ label: x.name, value: x.count }))} color={SERIES[0]} /></div>
        <div className="card p-5"><Bars title="Origem do conteúdo" items={stats.breakdowns.sources.map((x) => ({ label: SOURCE_LABEL[x.source] ?? x.source, value: x.count }))} color={SERIES[1]} /></div>
        <div className="card p-5"><Bars title="Planos (ativos)" items={stats.breakdowns.plans.map((x) => ({ label: x.plan, value: x.count }))} color={SERIES[2]} /></div>
        <div className="card p-5"><Bars title="Capa" items={stats.breakdowns.covers.map((x) => ({ label: x.mode === "ai" ? "IA" : x.mode === "own" ? "Foto própria" : "Sem capa", value: x.count }))} color={SERIES[3]} /></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-fg-3">Novos usuários</span><Link href="/admin/usuarios?f=new" className="text-xs text-lime">ver todos</Link></div>
          <div className="divide-y divide-line">
            {(newUsers ?? []).map((u) => (
              <Link key={u.id} href={`/admin/usuarios/${u.id}`} className="flex items-center justify-between py-2 text-sm hover:text-lime">
                <div className="min-w-0"><div className="truncate font-semibold">{u.full_name ?? u.email}</div><div className="truncate text-xs text-fg-3">{u.email}</div></div>
                <div className="text-right text-xs text-fg-3">{new Date(u.created_at).toLocaleDateString("pt-BR")}<div>{u.plan} · {u.credits} cr</div></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-fg-3">Acontecendo agora</span><Link href="/admin/atividade" className="text-xs text-lime">ver tudo</Link></div>
          <div className="divide-y divide-line">
            {(events ?? []).map((e) => {
              const p = e.profiles as unknown as { email: string; full_name: string | null } | null;
              return (
                <div key={e.id} className="py-2 text-sm">
                  <span className="font-semibold">{p?.full_name ?? p?.email ?? "sistema"}</span> <span className="text-fg-2">{EVENT_LABEL[e.event] ?? e.event}</span>
                  <div className="text-xs text-fg-3">{new Date(e.created_at).toLocaleString("pt-BR")}{e.meta && typeof e.meta === "object" && "template" in e.meta ? ` · ${(e.meta as { template: string }).template}` : ""}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-fg-3">Top usuários (30d)</div>
          <div className="divide-y divide-line">
            {stats.top_users.map((u) => (
              <Link key={u.id} href={`/admin/usuarios/${u.id}`} className="flex items-center justify-between py-2 text-sm hover:text-lime">
                <div className="min-w-0"><div className="truncate font-semibold">{u.full_name ?? u.email}</div><div className="truncate text-xs text-fg-3">{u.plan}{u.unlimited ? " · ∞" : ` · ${u.credits} cr`}</div></div>
                <div className="text-right text-xs"><b className="font-display text-lg">{u.carousels}</b><div className="text-fg-3">{u.spent} cr gastos</div></div>
              </Link>
            ))}
            {stats.top_users.length === 0 ? <div className="py-2 text-xs text-fg-3">Sem dados ainda.</div> : null}
          </div>
          <div className="mt-4 border-t border-line pt-3 text-xs font-bold uppercase tracking-wider text-fg-3">Últimas ações admin</div>
          <div className="divide-y divide-line">
            {(audit ?? []).map((a) => (
              <div key={a.id} className="py-2 text-xs"><span className="font-semibold">{a.actor_email}</span> <span className="text-fg-2">{a.action}</span>{a.target_email ? <span className="text-fg-3"> → {a.target_email}</span> : null}<div className="text-fg-3">{new Date(a.created_at).toLocaleString("pt-BR")}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
