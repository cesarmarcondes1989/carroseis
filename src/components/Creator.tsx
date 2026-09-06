"use client";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { resolveStyle } from "@/lib/render/Slide";
import { sampleSlides } from "@/lib/samples";
import { looksLikeScript, parseScript } from "@/lib/script-parse";
import { CREDIT_COST, type Aspect, type BrandModel, type CoverMode, type Profile, type Template } from "@/lib/types";
import { SlidePreview } from "./SlidePreview";
import { Alert, Field, Spinner } from "./ui";

type Source = "topic" | "url" | "youtube" | "pdf" | "script";

export function Creator({ templates, models, profile, initialTemplate, initialTopic, initialTone, initialHandle }: { templates: Template[]; models: BrandModel[]; profile: Profile; initialTemplate?: string; initialTopic?: string; initialTone?: string; initialHandle?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const defaultModel = models.find((m) => m.is_default);
  const [templateId, setTemplateId] = useState(initialTemplate && templates.some((x) => x.id === initialTemplate) ? initialTemplate : defaultModel?.template_id ?? templates[0]?.id);
  const [source, setSource] = useState<Source>("topic");
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [url, setUrl] = useState("");
  const [script, setScript] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [slidesCount, setSlidesCount] = useState(7);
  const [tone, setTone] = useState(initialTone && ["direto", "provocador", "didatico", "inspirador", "jornalistico"].includes(initialTone) ? initialTone : "direto");
  const [aspect, setAspect] = useState<Aspect>("4:5");
  const [seamless, setSeamless] = useState(false);
  const [coverMode, setCoverMode] = useState<CoverMode>("none");
  const [coverScene, setCoverScene] = useState("");
  const [handle, setHandle] = useState(initialHandle || defaultModel?.instagram_handle || profile.instagram_handle || "");
  const [modelId, setModelId] = useState(defaultModel?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [dismissedHint, setDismissedHint] = useState(false);
  const scriptHint = source === "topic" && !dismissedHint && looksLikeScript(topic);
  const parsedScript = useMemo(() => (source === "script" ? parseScript(script) : []), [source, script]);

  const template = templates.find((x) => x.id === templateId) ?? templates[0];
  const model = models.find((m) => m.id === modelId);
  const style = useMemo(() => resolveStyle(template, model ? { palette: model.palette ?? undefined, font_display: model.font_display, font_body: model.font_body, text_scale: Number(model.text_scale), instagram_handle: handle || model.instagram_handle } : { instagram_handle: handle || null }), [template, model, handle]);
  const cost = CREDIT_COST.carousel + (source === "script" ? 0 : CREDIT_COST.aiScript);
  const categories = ["all", ...Array.from(new Set(templates.map((x) => x.category)))];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const fields: Record<string, string> = { templateId, source, topic, url, script, slidesCount: String(slidesCount), tone, aspect, coverMode: template.supports_ai_cover ? coverMode : coverMode === "own" ? "own" : "none", coverScene, handle, brandModelId: modelId, seamless: String(seamless) };
      let res: Response;
      if (source === "pdf") {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        if (pdf) fd.append("file", pdf);
        res = await fetch("/api/carousels", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/carousels", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fields) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "INSUFFICIENT_CREDITS" ? t.common.insufficient : data.error || t.common.error);
      router.push(`/app/c/${data.carousel.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      setBusy(false);
    }
  }

  const sources: { id: Source; label: string }[] = [
    { id: "topic", label: t.create.sourceTopic },
    { id: "url", label: t.create.sourceUrl },
    { id: "youtube", label: t.create.sourceYoutube },
    { id: "pdf", label: t.create.sourcePdf },
    { id: "script", label: t.create.sourceScript },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-10">
        <h1 className="font-display text-2xl font-bold">{t.create.title}</h1>

        {/* 1. Template */}
        <section>
          <h2 className="text-lg font-bold">{t.create.step1}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={clsx("pill border", filter === c ? "border-lime bg-lime/10 text-lime" : "border-line text-fg-2")}>{c === "all" ? "Todos" : c}</button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {templates.filter((x) => filter === "all" || x.category === filter).map((tpl) => (
              <button key={tpl.id} onClick={() => setTemplateId(tpl.id)} className={clsx("group rounded-xl border-2 p-1 text-left transition", templateId === tpl.id ? "border-lime" : "border-transparent hover:border-line")}>
                <SlidePreview template={tpl} slide={sampleSlides(tpl, locale)[0]} index={0} total={5} aspect="4:5" style={resolveStyle(tpl, { instagram_handle: handle || "perfil" })} />
                <div className="mt-1 truncate px-1 text-xs font-bold">{tpl.name}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-fg-2">{template.description}</p>
        </section>

        {/* 2. Conteúdo */}
        <section>
          <h2 className="text-lg font-bold">{t.create.step2}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {sources.map((s) => (
              <button key={s.id} onClick={() => setSource(s.id)} className={clsx("btn btn-sm", source === s.id ? "btn-primary" : "btn-ghost")}>{s.label}</button>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {source === "topic" ? <textarea className="input min-h-28" placeholder={t.create.topicPlaceholder} value={topic} onChange={(e) => setTopic(e.target.value)} /> : null}
            {scriptHint ? (
              <div className="rounded-xl border border-lime/50 bg-lime/10 p-4 text-sm">
                <div className="font-bold">{t.create.scriptDetected}</div>
                <div className="mt-1 text-fg-2">{t.create.scriptDetectedDesc.replace("{n}", String(parseScript(topic).length))}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { setScript(topic); setSource("script"); }} className="btn btn-primary btn-sm">{t.create.useAsScript}</button>
                  <button onClick={() => setDismissedHint(true)} className="btn btn-ghost btn-sm">{t.create.letAiRewrite}</button>
                </div>
              </div>
            ) : null}
            {source === "url" || source === "youtube" ? (
              <>
                <input className="input" placeholder={source === "youtube" ? "https://youtube.com/watch?v=..." : t.create.urlPlaceholder} value={url} onChange={(e) => setUrl(e.target.value)} />
                <input className="input" placeholder={t.create.topicPlaceholder} value={topic} onChange={(e) => setTopic(e.target.value)} />
              </>
            ) : null}
            {source === "pdf" ? (
              <>
                <input type="file" accept="application/pdf" className="input" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
                <input className="input" placeholder={t.create.topicPlaceholder} value={topic} onChange={(e) => setTopic(e.target.value)} />
              </>
            ) : null}
            {source === "script" ? (
              <>
                <textarea className="input min-h-48 font-mono text-sm" placeholder={t.create.scriptPlaceholder} value={script} onChange={(e) => setScript(e.target.value)} />
                {parsedScript.length ? (
                  <div className="rounded-xl border border-line bg-bg-2 p-3 text-xs">
                    <div className="font-bold text-fg-2">{t.create.cardsDetected.replace("{n}", String(parsedScript.length))}</div>
                    <ol className="mt-2 space-y-1 text-fg-3">
                      {parsedScript.map((sl, i) => <li key={i} className="truncate"><span className="text-lime">{i + 1}.</span> <span className="text-fg">{sl.titulo}</span>{sl.texto ? ` · ${sl.texto.slice(0, 60)}` : ""}</li>)}
                    </ol>
                  </div>
                ) : script.trim() ? <div className="text-xs text-fg-3">{t.create.noCards}</div> : null}
              </>
            ) : null}
            {source !== "script" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t.create.slidesCount}: ${slidesCount}`}><input type="range" min={3} max={10} value={slidesCount} onChange={(e) => setSlidesCount(Number(e.target.value))} className="w-full accent-lime" /></Field>
                <Field label={t.create.tone}>
                  <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
                    {Object.entries(t.create.tones).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
              </div>
            ) : null}
          </div>
        </section>

        {/* 3. Capa e formato */}
        <section>
          <h2 className="text-lg font-bold">{t.create.step3}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {([
              { id: "ai", label: t.create.coverAi, desc: t.create.coverAiDesc, disabled: !template.supports_ai_cover },
              { id: "own", label: t.create.coverOwn, desc: t.create.coverOwnDesc, disabled: false },
              { id: "none", label: t.create.coverNone, desc: t.create.coverNoneDesc, disabled: false },
            ] as { id: CoverMode; label: string; desc: string; disabled: boolean }[]).map((o) => (
              <button key={o.id} disabled={o.disabled} onClick={() => setCoverMode(o.id)} className={clsx("card p-4 text-left transition disabled:opacity-40", coverMode === o.id && !o.disabled ? "border-lime" : "hover:border-fg-3")}>
                <div className="font-bold">{o.label}</div>
                <div className="text-xs text-fg-2">{o.desc}</div>
              </button>
            ))}
          </div>
          {coverMode === "ai" && template.supports_ai_cover ? <textarea className="input mt-3" placeholder={t.create.scenePlaceholder} value={coverScene} onChange={(e) => setCoverScene(e.target.value)} /> : null}
          <label className="card mt-4 flex cursor-pointer items-center gap-3 p-4">
            <input type="checkbox" className="h-5 w-5 accent-lime" checked={seamless} onChange={(e) => setSeamless(e.target.checked)} />
            <div><div className="font-bold">{t.create.seamless}</div><div className="text-xs text-fg-2">{t.create.seamlessDesc}</div></div>
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label={t.create.aspect}>
              <div className="flex gap-2">
                {(["4:5", "1:1"] as Aspect[]).map((a) => <button key={a} onClick={() => setAspect(a)} className={clsx("btn btn-sm flex-1", aspect === a ? "btn-primary" : "btn-ghost")}>{a}</button>)}
              </div>
            </Field>
            <Field label={t.create.handle}><input className="input" value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} placeholder="seuperfil" /></Field>
            <Field label={t.create.brandModel}>
              <select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
                <option value="">{t.create.noModel}</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}{m.is_default ? " ★" : ""}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {error ? <Alert>{error}</Alert> : null}
        <div className="flex items-center gap-4">
          <button onClick={submit} disabled={busy} className="btn btn-primary text-base">{busy ? <><Spinner /> {t.create.generating}</> : `${t.create.generate} →`}</button>
          <span className="text-sm text-fg-2">{t.create.cost}: <b className="text-lime">{cost}</b> {t.pricing.credits}{coverMode === "ai" && template.supports_ai_cover ? ` + ${CREDIT_COST.aiCover} (capa)` : ""}</span>
        </div>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{t.studio.preview}</div>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line">
          <SlidePreview template={template} slide={topic.trim() ? { titulo: topic.split(/\n/)[0].slice(0, 90), etiqueta: template.name } : sampleSlides(template, locale)[0]} index={0} total={slidesCount} aspect={aspect} style={style} authorName={profile.full_name} avatarUrl={profile.avatar_url} seamless={seamless} carouselTitle={topic.split(/\n/)[0] || template.name} />
        </div>
        {seamless ? (
          <div className="mt-2 flex gap-1 overflow-hidden rounded-xl border border-line">
            {[0, 1, 2].map((i) => <div key={i} className="min-w-0 flex-1"><SlidePreview template={template} slide={{ titulo: `Card ${i + 2}`, texto: t.create.seamlessPreview }} index={i + 1} total={slidesCount} aspect={aspect} style={style} seamless carouselTitle={topic.split(/\n/)[0] || template.name} /></div>)}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
