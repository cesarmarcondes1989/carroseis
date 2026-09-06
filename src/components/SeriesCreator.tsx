"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { resolveStyle } from "@/lib/render/Slide";
import { sampleSlides } from "@/lib/samples";
import { CREDIT_COST, type Aspect, type BrandModel, type Carousel, type CoverMode, type Profile, type Template } from "@/lib/types";
import { SlidePreview } from "./SlidePreview";
import { Alert, Field, Spinner } from "./ui";

type Result = { id: string; name: string; carousels: Carousel[]; failed: { title: string; error: string }[] };

export function SeriesCreator({ templates, models, profile, initialTemplate, initialTopic }: { templates: Template[]; models: BrandModel[]; profile: Profile; initialTemplate?: string; initialTopic?: string }) {
  const { t, locale } = useI18n();
  const s = t.series;
  const defaultModel = models.find((m) => m.is_default);
  const [templateId, setTemplateId] = useState(initialTemplate && templates.some((x) => x.id === initialTemplate) ? initialTemplate : defaultModel?.template_id ?? templates[0]?.id);
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [url, setUrl] = useState("");
  const [count, setCount] = useState(4);
  const [slidesCount, setSlidesCount] = useState(8);
  const [tone, setTone] = useState("direto");
  const [aspect, setAspect] = useState<Aspect>("4:5");
  const [seamless, setSeamless] = useState(false);
  const [coverMode, setCoverMode] = useState<CoverMode>("none");
  const [handle, setHandle] = useState(defaultModel?.instagram_handle || profile.instagram_handle || "");
  const [modelId, setModelId] = useState(defaultModel?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const template = templates.find((x) => x.id === templateId) ?? templates[0];
  const model = models.find((m) => m.id === modelId);
  const style = useMemo(() => resolveStyle(template, model ? { palette: model.palette ?? undefined, font_display: model.font_display, font_body: model.font_body, text_scale: Number(model.text_scale), instagram_handle: handle || model.instagram_handle } : { instagram_handle: handle || null }), [template, model, handle]);
  const cost = (CREDIT_COST.carousel + CREDIT_COST.aiScript) * count;
  const canAfford = profile.unlimited_credits || profile.credits >= cost;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const body = { templateId, topic, url, count, slidesCount, tone, aspect, coverMode: template.supports_ai_cover ? coverMode : coverMode === "own" ? "own" : "none", handle, brandModelId: modelId, seamless };
      const res = await fetch("/api/series", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "INSUFFICIENT_CREDITS" ? t.common.insufficient : data.error || t.common.error);
      setResult(data.series);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-4xl">
        <span className="pill border border-lime/40 bg-lime/10 text-lime">{s.badge}</span>
        <h1 className="mt-3 font-display text-2xl font-bold">{result.name}</h1>
        <p className="mt-1 text-fg-2">{s.doneDesc.replace("{n}", String(result.carousels.length))}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {result.carousels.map((c) => (
            <Link key={c.id} href={`/app/c/${c.id}`} className="group">
              <div className="overflow-hidden rounded-2xl border border-line transition group-hover:border-lime/60">
                <SlidePreview template={template} slide={c.slides[0] ?? { titulo: c.title }} index={0} total={c.slides.length || 1} aspect={c.aspect} style={style} authorName={profile.full_name} />
              </div>
              <div className="mt-2 px-1 text-xs text-fg-3">{s.episode} {c.series_index}/{c.series_total}</div>
              <div className="truncate px-1 text-sm font-bold">{c.slides[0]?.titulo ?? c.title}</div>
            </Link>
          ))}
        </div>
        {result.failed.length ? <div className="mt-4"><Alert kind="error">{s.failed}: {result.failed.map((f) => `${f.title} (${f.error})`).join("; ")}</Alert></div> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary">{s.goProjects}</Link>
          <button className="btn btn-ghost" onClick={() => setResult(null)}>{s.another}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div>
          <span className="pill border border-lime/40 bg-lime/10 text-lime">{s.badge}</span>
          <h1 className="mt-2 font-display text-2xl font-bold">{s.title}</h1>
          <p className="mt-1 text-fg-2">{s.subtitle}</p>
        </div>

        <section>
          <h2 className="text-lg font-bold">{s.stepTopic}</h2>
          <textarea className="input mt-3 min-h-28" placeholder={s.topicPlaceholder} value={topic} onChange={(e) => setTopic(e.target.value)} />
          <input className="input mt-2" placeholder={s.urlPlaceholder} value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={`${s.count}: ${count}`}>
              <input type="range" min={2} max={7} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-lime" />
              <div className="mt-1 text-xs text-fg-3">{s.countHint}</div>
            </Field>
            <Field label={`${t.create.slidesCount}: ${slidesCount}`}>
              <input type="range" min={4} max={10} value={slidesCount} onChange={(e) => setSlidesCount(Number(e.target.value))} className="w-full accent-lime" />
              <div className="mt-1 text-xs text-fg-3">{s.slidesHint}</div>
            </Field>
          </div>
          <Field label={t.create.tone}>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(t.create.tones).map(([k, v]) => <button key={k} onClick={() => setTone(k)} className={clsx("btn btn-sm", tone === k ? "btn-primary" : "btn-ghost")}>{v}</button>)}
            </div>
          </Field>
        </section>

        <section>
          <h2 className="text-lg font-bold">{s.stepTemplate}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {templates.map((tpl) => (
              <button key={tpl.id} onClick={() => setTemplateId(tpl.id)} className={clsx("group rounded-xl border-2 p-1 text-left transition", templateId === tpl.id ? "border-lime" : "border-transparent hover:border-line")}>
                <SlidePreview template={tpl} slide={sampleSlides(tpl, locale)[0]} index={0} total={5} aspect="4:5" style={resolveStyle(tpl, { instagram_handle: handle || "perfil" })} />
                <div className="mt-1 truncate px-1 text-xs font-bold">{tpl.name}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label={t.create.aspect}>
            <div className="flex gap-2">{(["4:5", "1:1"] as Aspect[]).map((a) => <button key={a} onClick={() => setAspect(a)} className={clsx("btn btn-sm flex-1", aspect === a ? "btn-primary" : "btn-ghost")}>{a}</button>)}</div>
          </Field>
          <Field label={t.create.handle}><input className="input" value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} /></Field>
          <Field label={t.studio.cover}>
            <select className="input" value={coverMode} onChange={(e) => setCoverMode(e.target.value as CoverMode)}>
              <option value="none">{t.create.coverNone}</option>
              <option value="own">{t.create.coverOwn}</option>
              {template.supports_ai_cover ? <option value="ai">{t.create.coverAi} ({s.coverAiLater})</option> : null}
            </select>
          </Field>
          {models.length ? (
            <Field label={t.create.brandModel}>
              <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
                <option value="">{t.create.noModel}</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          ) : null}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 sm:col-span-2">
            <input type="checkbox" className="h-5 w-5 accent-lime" checked={seamless} onChange={(e) => setSeamless(e.target.checked)} />
            <div><div className="text-sm font-bold">{t.create.seamless}</div><div className="text-xs text-fg-2">{t.create.seamlessDesc}</div></div>
          </label>
        </section>
      </div>

      <aside className="card h-fit p-4 lg:sticky lg:top-8">
        <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{t.studio.preview}</div>
        <div className="mt-2 overflow-hidden rounded-xl border border-line">
          <SlidePreview template={template} slide={sampleSlides(template, locale)[0]} index={0} total={slidesCount} aspect={aspect} style={style} seamless={seamless} authorName={profile.full_name} />
        </div>
        <div className="mt-4 rounded-xl bg-bg-3 p-3 text-sm">
          <div className="flex justify-between"><span className="text-fg-2">{t.create.cost}</span><span className="font-bold">{cost} {t.app.credits.toLowerCase()}</span></div>
          <div className="mt-1 text-xs text-fg-3">{s.costHint.replace("{n}", String(count)).replace("{c}", String(CREDIT_COST.carousel + CREDIT_COST.aiScript))}</div>
        </div>
        {error ? <div className="mt-3"><Alert kind="error">{error}</Alert></div> : null}
        {!canAfford ? <div className="mt-3"><Alert kind="info">{t.common.insufficient} <Link href="/app/creditos" className="underline">{t.creditsPage.buy}</Link></Alert></div> : null}
        <button className="btn btn-primary mt-4 w-full" disabled={busy || !topic.trim() || !canAfford} onClick={submit}>{busy ? <><Spinner /> {s.generating}</> : `⚡ ${s.generate}`}</button>
        {busy ? <p className="mt-2 text-center text-xs text-fg-3">{s.generatingHint}</p> : null}
      </aside>
    </div>
  );
}
