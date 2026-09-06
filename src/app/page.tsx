import Link from "next/link";
import { Footer, Nav } from "@/components/Nav";
import { SlidePreview } from "@/components/SlidePreview";
import { getDict } from "@/lib/i18n/server";
import { resolveStyle } from "@/lib/render/Slide";
import { sampleSlides } from "@/lib/samples";
import { TEMPLATES } from "@/lib/templates/registry";
import { formatBRL } from "@/lib/format";
import type { Plan, Template } from "@/lib/types";

async function loadTemplates(): Promise<Template[]> {
  try {
    const { listTemplates } = await import("@/lib/carousel-service");
    return await listTemplates();
  } catch {
    return TEMPLATES;
  }
}
async function loadPlans(): Promise<Plan[]> {
  try {
    const { adminClient } = await import("@/lib/supabase/admin");
    const { data } = await adminClient().from("plans").select("*").eq("active", true).order("sort_order");
    if (data?.length) return data as Plan[];
  } catch {
    /* fallback */
  }
  return [
    { id: "free", name: "Grátis", price_cents: 0, credits: 30, period_days: 0, highlight: false, active: true, sort_order: 0 },
    { id: "weekly", name: "Semanal", price_cents: 990, credits: 40, period_days: 7, highlight: false, active: true, sort_order: 10 },
    { id: "creator", name: "Creator", price_cents: 2990, credits: 200, period_days: 30, highlight: true, active: true, sort_order: 20 },
    { id: "pro", name: "Pro", price_cents: 5990, credits: 420, period_days: 30, highlight: false, active: true, sort_order: 30 },
    { id: "agency", name: "Agência", price_cents: 14990, credits: 1320, period_days: 30, highlight: false, active: true, sort_order: 40 },
  ];
}

export default async function Home() {
  const { t, locale } = await getDict();
  const [templates, plans] = await Promise.all([loadTemplates(), loadPlans()]);
  const heroTemplates = ["marketing", "noticias-virais", "insider", "full-texto", "essencial"].map((id) => templates.find((x) => x.id === id)!).filter(Boolean);

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="glow relative overflow-hidden">
          <div className="grid-bg absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
            <div className="fade-up">
              <span className="pill border border-lime/40 bg-lime/10 text-lime">{t.hero.kicker}</span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">{t.hero.title}</h1>
              <p className="mt-6 max-w-xl text-lg text-fg-2">{t.hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cadastro" className="btn btn-primary text-base">{t.hero.cta} →</Link>
                <Link href="#templates" className="btn btn-ghost text-base">{t.hero.cta2}</Link>
              </div>
              <p className="mt-4 text-sm text-fg-3">{t.hero.proof}</p>
            </div>
            <div className="relative h-[420px] md:h-[520px]">
              {heroTemplates.map((tpl, i) => {
                const style = resolveStyle(tpl, { instagram_handle: "seuperfil" });
                const rot = [-8, 4, -3, 6, -5][i];
                const left = [0, 18, 36, 54, 70][i];
                return (
                  <div key={tpl.id} className="absolute top-0 w-[46%] shadow-2xl shadow-black/60 transition hover:z-20 hover:scale-105" style={{ left: `${left}%`, transform: `rotate(${rot}deg) translateY(${i * 14}px)`, zIndex: i }}>
                    <SlidePreview template={tpl} slide={sampleSlides(tpl, locale)[0]} index={0} total={7} aspect="4:5" style={style} authorName="Cesar" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="overflow-hidden border-y border-line/60 bg-bg-2 py-3">
          <div className="marquee flex w-max gap-10 whitespace-nowrap text-sm font-bold uppercase tracking-widest text-fg-3">
            {[...templates, ...templates].map((tpl, i) => (
              <span key={i}>{tpl.name} <span className="text-lime">✦</span></span>
            ))}
          </div>
        </div>

        {/* HOW */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t.how.title}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.how.steps.map((s, i) => (
              <div key={i} className="card p-6">
                <div className="font-display text-5xl font-bold text-lime">0{i + 1}</div>
                <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-fg-2">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TEMPLATES */}
        <section id="templates" className="border-t border-line/60 bg-bg-2/40 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t.templates.title}</h2>
            <p className="mt-3 max-w-2xl text-fg-2">{t.templates.subtitle}</p>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {templates.map((tpl) => {
                const style = resolveStyle(tpl, { instagram_handle: "seuperfil" });
                return (
                  <Link href={`/app/novo?template=${tpl.id}`} key={tpl.id} className="group">
                    <div className="overflow-hidden rounded-2xl border border-line transition group-hover:border-lime/60 group-hover:shadow-xl group-hover:shadow-lime/10">
                      <SlidePreview template={tpl} slide={sampleSlides(tpl, locale)[0]} index={0} total={6} aspect="4:5" style={style} authorName="Cesar" />
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-sm font-bold">{tpl.name}</span>
                      {!tpl.supports_ai_cover ? <span className="text-[10px] font-bold uppercase text-fg-3">{t.templates.noAiCover}</span> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* MCP */}
        <section id="mcp" className="mx-auto max-w-6xl px-5 py-20">
          <div className="card glow grid gap-10 overflow-hidden p-8 md:grid-cols-2 md:p-12">
            <div>
              <span className="pill border border-violet/50 bg-violet/15 text-violet">Model Context Protocol</span>
              <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">{t.mcp.title}</h2>
              <p className="mt-4 text-fg-2">{t.mcp.subtitle}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {t.mcp.bullets.map((b) => (
                  <li key={b} className="flex gap-2"><span className="text-lime">✓</span>{b}</li>
                ))}
              </ul>
              <Link href="/app/chave-api" className="btn btn-primary mt-8">{t.mcp.cta}</Link>
            </div>
            <div className="rounded-2xl border border-line bg-black/60 p-5 font-mono text-[13px] leading-relaxed text-fg-2">
              <div className="text-fg-3"># Claude</div>
              <div><span className="text-pink">você:</span> cria um carrossel sobre 5 erros no tráfego pago, template marketing</div>
              <div className="mt-3"><span className="text-lime">claude:</span> Quer colocar seu @ na arte? A capa vai ser por IA (10 créditos) ou foto sua?</div>
              <div className="mt-3"><span className="text-pink">você:</span> @cesar, capa por IA, cena: mesa de escritório com notebook e café</div>
              <div className="mt-3"><span className="text-lime">claude:</span> <span className="text-fg-3">→ criar_carrossel(...)</span></div>
              <div className="mt-1 text-fg">Carrossel criado: 7 cards. Link pra ver, ajustar e baixar: carrosseisia.com.br/app/c/…</div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="precos" className="border-t border-line/60 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t.pricing.title}</h2>
            <p className="mt-3 max-w-2xl text-fg-2">{t.pricing.subtitle}</p>
            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {plans.map((p) => (
                <div key={p.id} className={`card relative flex flex-col p-5 ${p.highlight ? "border-lime/60 shadow-lg shadow-lime/10" : ""}`}>
                  {p.highlight ? <span className="pill absolute -top-3 left-4 bg-lime text-black">{t.pricing.popular}</span> : null}
                  <div className="text-sm font-bold text-fg-2">{p.name}</div>
                  <div className="mt-2 font-display text-3xl font-bold">{p.price_cents ? formatBRL(p.price_cents) : t.pricing.free}</div>
                  <div className="text-xs text-fg-3">{p.period_days === 7 ? t.pricing.perWeek : p.period_days ? t.pricing.perMonth : ""}</div>
                  <div className="mt-4 text-sm"><span className="font-bold text-lime">{p.credits}</span> {t.pricing.credits}</div>
                  <div className="mt-1 text-xs text-fg-2">{p.period_days ? t.pricing.upTo.replace("{n}", String(p.credits)) : t.pricing.freeDesc}</div>
                  <Link href={p.id === "free" ? "/cadastro" : `/app/creditos?plano=${p.id}`} className={`btn mt-5 w-full ${p.highlight ? "btn-primary" : "btn-ghost"}`}>{p.id === "free" ? t.nav.signup : t.pricing.buy}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold">{t.faq.title}</h2>
          <div className="mt-8 divide-y divide-line">
            {t.faq.items.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none text-lg font-bold marker:hidden">{f.q}</summary>
                <p className="mt-2 text-fg-2">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/cadastro" className="btn btn-primary text-base">{t.hero.cta} →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
