"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { resolveStyle } from "@/lib/render/Slide";
import { FONT_NAMES, pickTemplate } from "@/lib/templates/registry";
import { CREDIT_COST, type Aspect, type BrandModel, type BrandOverrides, type Carousel, type Profile, type Slide, type Template } from "@/lib/types";
import { DownloadPanel } from "./DownloadPanel";
import { SlidePreview } from "./SlidePreview";
import { Alert, CopyButton, Field, Spinner } from "./ui";

const STORAGE = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/carousels/` : "";

export function Studio({ initial, templates, models, profile, canDownload, canEditTemplates = false }: { initial: Carousel; templates: Template[]; models: BrandModel[]; profile: Profile; canDownload: boolean; canEditTemplates?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [c, setC] = useState<Carousel>(initial);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "ok" | "info"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"slides" | "brand" | "cover">("slides");
  const [scene, setScene] = useState(initial.cover_scene ?? "");
  const [modelName, setModelName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const template = pickTemplate(templates, c);
  const ov = useMemo<BrandOverrides>(() => c.brand_overrides ?? {}, [c.brand_overrides]);
  const style = useMemo(() => resolveStyle(template, ov, c.instagram_handle), [template, ov, c.instagram_handle]);
  const coverUrl = c.cover_image_path ? STORAGE + c.cover_image_path : null;

  const update = useCallback((patch: Partial<Carousel>) => {
    setC((prev) => ({ ...prev, ...patch, renders: [] }));
    setDirty(true);
  }, []);

  const setOverrides = (p: Partial<BrandOverrides>) => update({ brand_overrides: { ...ov, ...p } });
  const setPalette = (k: string, v: string) => setOverrides({ palette: { ...(ov.palette ?? {}), [k]: v } });
  const setSlide = (i: number, patch: Partial<Slide>) => update({ slides: c.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  async function call(label: string, fn: () => Promise<Response>) {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error === "INSUFFICIENT_CREDITS" ? t.common.insufficient : data.error === "PLAN_REQUIRED" ? t.studio.downloadLocked : data.error || t.common.error);
      if (data.carousel) {
        setC(data.carousel);
        setDirty(false);
      }
      return data;
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : t.common.error });
      return null;
    } finally {
      setBusy(null);
    }
  }

  const save = useCallback(async () => {
    const body = { title: c.title, template_id: c.template_id, user_template_id: c.user_template_id ?? null, aspect: c.aspect, slides: c.slides, brand_overrides: c.brand_overrides, instagram_handle: c.instagram_handle, cover_scene: c.cover_scene, caption: c.caption, seamless: !!c.seamless };
    const data = await call("save", () => fetch(`/api/carousels/${c.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    if (data) setMsg({ kind: "ok", text: t.studio.saved });
    return !!data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c]);

  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(() => void save(), 1500);
    return () => clearTimeout(id);
  }, [dirty, c, save]);

  async function render() {
    if (dirty) {
      const ok = await save();
      if (!ok) return;
    }
    await call("render", () => fetch(`/api/carousels/${c.id}/render`, { method: "POST" }));
  }

  async function generateCover() {
    if (!c.cover_ai_charged && !profile.unlimited_credits && !confirm(`${t.studio.generateCover}?`)) return;
    await call("cover", () => fetch(`/api/carousels/${c.id}/cover`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scene }) }));
  }

  async function uploadCover(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    await call("upload", () => fetch(`/api/carousels/${c.id}/cover`, { method: "PUT", body: fd }));
  }

  async function saveModel(asDefault: boolean) {
    const name = modelName.trim() || `${template.name} ${new Date().toLocaleDateString("pt-BR")}`;
    const body = { name, template_id: c.template_id, palette: ov.palette ?? null, font_display: ov.font_display ?? null, font_body: ov.font_body ?? null, text_scale: ov.text_scale ?? 1, instagram_handle: c.instagram_handle, is_default: asDefault };
    const res = await fetch("/api/brand-models", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? { kind: "ok", text: `${t.studio.saved}: ${name}` } : { kind: "error", text: t.common.error });
    if (res.ok) router.refresh();
  }

  async function remove() {
    if (!confirm(`${t.common.delete}?`)) return;
    await fetch(`/api/carousels/${c.id}`, { method: "DELETE" });
    router.push("/app");
  }

  const slide = c.slides[active] ?? c.slides[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      {/* Coluna esquerda: preview + filmstrip */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input className="min-w-0 flex-1 bg-transparent font-display text-2xl font-bold outline-none" value={c.title} onChange={(e) => update({ title: e.target.value })} />
          <div className="flex items-center gap-2">
            <span className={clsx("pill", c.status === "ready" ? "bg-ok/15 text-ok" : c.status === "error" ? "bg-danger/15 text-danger" : "bg-bg-3 text-fg-2")}>{t.app.status[c.status]}</span>
            {dirty || busy === "save" ? <span className="text-xs text-fg-3">{busy === "save" ? t.common.loading : "•"}</span> : null}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-line shadow-2xl shadow-black/50">
            {slide ? <SlidePreview template={template} slide={slide} index={active} total={c.slides.length} aspect={c.aspect} style={style} coverImage={coverUrl} authorName={profile.full_name} avatarUrl={profile.avatar_url} seamless={!!c.seamless} carouselTitle={c.title} /> : null}
          </div>
          <div className="card flex flex-col gap-3 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{t.studio.slides} · {active + 1}/{c.slides.length}</div>
            {slide ? (
              <>
                <Field label={t.studio.titleLabel}><textarea className="input min-h-20" value={slide.titulo} onChange={(e) => setSlide(active, { titulo: e.target.value })} /></Field>
                <Field label={t.studio.textLabel}><textarea className="input min-h-24" value={slide.texto ?? ""} onChange={(e) => setSlide(active, { texto: e.target.value })} /></Field>
                <Field label={t.studio.tagLabel}><input className="input" value={slide.etiqueta ?? ""} onChange={(e) => setSlide(active, { etiqueta: e.target.value })} /></Field>
              </>
            ) : null}
            <div className="mt-auto flex flex-wrap gap-2">
              <button className="btn btn-ghost btn-sm" disabled={active === 0} onClick={() => { const s = [...c.slides]; [s[active - 1], s[active]] = [s[active], s[active - 1]]; update({ slides: s }); setActive(active - 1); }}>←</button>
              <button className="btn btn-ghost btn-sm" disabled={active >= c.slides.length - 1} onClick={() => { const s = [...c.slides]; [s[active + 1], s[active]] = [s[active], s[active + 1]]; update({ slides: s }); setActive(active + 1); }}>→</button>
              <button className="btn btn-ghost btn-sm" disabled={c.slides.length >= 10} onClick={() => { update({ slides: [...c.slides.slice(0, active + 1), { titulo: "Novo card" }, ...c.slides.slice(active + 1)] }); setActive(active + 1); }}>＋ {t.studio.addSlide}</button>
              <button className="btn btn-danger btn-sm" disabled={c.slides.length <= 2} onClick={() => { update({ slides: c.slides.filter((_, i) => i !== active) }); setActive(Math.max(0, active - 1)); }}>{t.common.delete}</button>
            </div>
          </div>
        </div>

        {/* filmstrip */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {c.slides.map((s, i) => (
            <button key={i} onClick={() => setActive(i)} className={clsx("w-24 shrink-0 overflow-hidden rounded-lg border-2", i === active ? "border-lime" : "border-transparent")}>
              {c.renders?.[i]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.renders[i].url} alt="" className="w-full" />
              ) : (
                <SlidePreview template={template} slide={s} index={i} total={c.slides.length} aspect={c.aspect} style={style} coverImage={coverUrl} authorName={profile.full_name} avatarUrl={profile.avatar_url} seamless={!!c.seamless} carouselTitle={c.title} />
              )}
            </button>
          ))}
        </div>

        {msg ? <div className="mt-4"><Alert kind={msg.kind}>{msg.text}</Alert></div> : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={render} disabled={!!busy} className="btn btn-primary">{busy === "render" ? <><Spinner /> {t.studio.rendering}</> : `🎨 ${t.studio.render}`}</button>
          <button onClick={() => call("rewrite", () => fetch(`/api/carousels/${c.id}/rewrite`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }))} disabled={!!busy} className="btn btn-ghost">{busy === "rewrite" ? <Spinner /> : `✨ ${t.studio.regenerate}`}</button>
          <button onClick={remove} className="btn btn-danger btn-sm ml-auto">{t.common.delete}</button>
        </div>

        <DownloadPanel carousel={c} canDownload={canDownload} />

        {c.caption ? (
          <div className="card mt-6 p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-fg-3">{t.studio.caption}</span><CopyButton text={`${c.caption}\n\n${(c.hashtags ?? []).map((h) => `#${h}`).join(" ")}`} /></div>
            <textarea className="input mt-2 min-h-28" value={c.caption} onChange={(e) => update({ caption: e.target.value })} />
            <div className="mt-2 text-xs text-fg-2">{(c.hashtags ?? []).map((h) => `#${h}`).join(" ")}</div>
          </div>
        ) : null}
      </div>

      {/* Coluna direita: painel */}
      <aside className="card h-fit p-4 xl:sticky xl:top-8">
        <div className="flex gap-1 rounded-xl bg-bg-3 p-1">
          {(["slides", "brand", "cover"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={clsx("flex-1 rounded-lg py-2 text-sm font-bold", tab === k ? "bg-bg text-fg" : "text-fg-2")}>{k === "slides" ? t.studio.template : k === "brand" ? t.studio.brand : t.studio.cover}</button>
          ))}
        </div>

        {tab === "slides" ? (
          <div className="mt-4 space-y-4">
            <Field label={t.studio.template}>
              <select className="input" value={template.id} onChange={(e) => { const x = templates.find((t) => t.id === e.target.value); if (!x) return; update(x.custom ? { user_template_id: x.user_template_id ?? null, template_id: x.base_template_id ?? c.template_id } : { template_id: x.id, user_template_id: null }); }}>
                {templates.some((x) => x.custom) ? <optgroup label={t.templatesPage.mine}>{templates.filter((x) => x.custom).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup> : null}
                <optgroup label={t.templatesPage.catalog}>{templates.filter((x) => !x.custom).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
              </select>
              {canEditTemplates ? (
                <Link href={template.custom ? `/app/templates/${template.user_template_id}` : `/app/templates/novo?from=${template.id}`} className="mt-1 inline-block text-xs text-lime hover:underline">✎ {template.custom ? t.templatesPage.editThis : t.templatesPage.createFrom}</Link>
              ) : null}
            </Field>
            <Field label={t.create.aspect}>
              <div className="flex gap-2">{(["4:5", "1:1"] as Aspect[]).map((a) => <button key={a} onClick={() => update({ aspect: a })} className={clsx("btn btn-sm flex-1", c.aspect === a ? "btn-primary" : "btn-ghost")}>{a}</button>)}</div>
            </Field>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
              <input type="checkbox" className="h-5 w-5 accent-lime" checked={!!c.seamless} onChange={(e) => update({ seamless: e.target.checked })} />
              <div><div className="text-sm font-bold">{t.create.seamless}</div><div className="text-xs text-fg-2">{t.create.seamlessDesc}</div></div>
            </label>
            <Field label={t.create.handle}><input className="input" value={c.instagram_handle ?? ""} onChange={(e) => update({ instagram_handle: e.target.value.replace(/^@/, "") || null })} /></Field>
            {models.length ? (
              <Field label={t.create.brandModel}>
                <select className="input" value={c.brand_model_id ?? ""} onChange={(e) => { const m = models.find((x) => x.id === e.target.value); update({ brand_model_id: m?.id ?? null, brand_overrides: m ? { palette: m.palette ?? undefined, font_display: m.font_display, font_body: m.font_body, text_scale: Number(m.text_scale), instagram_handle: m.instagram_handle } : null, template_id: m?.template_id ?? c.template_id }); }}>
                  <option value="">{t.create.noModel}</option>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
            ) : null}
          </div>
        ) : null}

        {tab === "brand" ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 text-sm font-semibold text-fg-2">{t.studio.colors}</div>
              <div className="grid grid-cols-5 gap-2">
                {(["bg", "fg", "accent", "muted", "accent2"] as const).map((k) => (
                  <label key={k} className="flex flex-col items-center gap-1 text-[10px] uppercase text-fg-3">
                    <input type="color" value={style.palette[k]} onChange={(e) => setPalette(k, e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-line bg-transparent" />
                    {k}
                  </label>
                ))}
              </div>
            </div>
            {template.layout === "insider" ? (
              <Field label="Fundo">
                <div className="flex gap-2">{(["dark", "light"] as const).map((v) => <button key={v} onClick={() => setOverrides({ variant: v })} className={clsx("btn btn-sm flex-1", style.variant === v ? "btn-primary" : "btn-ghost")}>{v === "dark" ? "Preto" : "Branco"}</button>)}</div>
              </Field>
            ) : null}
            <Field label={`${t.studio.font} (título)`}>
              <select className="input" value={style.fontDisplay} onChange={(e) => setOverrides({ font_display: e.target.value })}>{FONT_NAMES.map((f) => <option key={f} value={f}>{f}</option>)}</select>
            </Field>
            <Field label={`${t.studio.font} (texto)`}>
              <select className="input" value={style.fontBody} onChange={(e) => setOverrides({ font_body: e.target.value })}>{FONT_NAMES.map((f) => <option key={f} value={f}>{f}</option>)}</select>
            </Field>
            <Field label={`${t.studio.textScale}: ${Math.round(style.scale * 100)}%`}>
              <input type="range" min={0.7} max={1.4} step={0.05} value={style.scale} onChange={(e) => setOverrides({ text_scale: Number(e.target.value) })} className="w-full accent-lime" />
            </Field>
            <button className="btn btn-ghost btn-sm w-full" onClick={() => update({ brand_overrides: null, brand_model_id: null })}>↺ Reset</button>
            <div className="border-t border-line pt-4">
              <div className="mb-2 text-sm font-semibold text-fg-2">{t.studio.saveModel}</div>
              <input className="input" placeholder="Nome do modelo" value={modelName} onChange={(e) => setModelName(e.target.value)} />
              <div className="mt-2 flex gap-2">
                <button className="btn btn-primary btn-sm flex-1" onClick={() => saveModel(false)}>{t.common.confirm}</button>
                <button className="btn btn-ghost btn-sm flex-1" onClick={() => saveModel(true)}>★ {t.models.makeDefault}</button>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "cover" ? (
          <div className="mt-4 space-y-4">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="w-full rounded-xl border border-line" />
            ) : (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-3">{t.create.coverNone}</div>
            )}
            {template.supports_ai_cover ? (
              <>
                <Field label={t.create.coverAi}><textarea className="input min-h-20" value={scene} onChange={(e) => { setScene(e.target.value); update({ cover_scene: e.target.value }); }} placeholder={t.create.scenePlaceholder} /></Field>
                <button className="btn btn-primary w-full" disabled={!!busy} onClick={generateCover}>{busy === "cover" ? <><Spinner /> {t.common.loading}</> : c.cover_ai_charged ? "✨ Gerar de novo (já pago)" : `✨ ${t.studio.generateCover}`}</button>
              </>
            ) : <p className="text-xs text-fg-3">{t.templates.noAiCover}</p>}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            <button className="btn btn-ghost w-full" disabled={!!busy} onClick={() => fileRef.current?.click()}>{busy === "upload" ? <Spinner /> : `📷 ${t.studio.uploadCover}`}</button>
            {coverUrl ? <button className="btn btn-danger btn-sm w-full" onClick={() => call("rmcover", () => fetch(`/api/carousels/${c.id}/cover`, { method: "DELETE" }))}>{t.studio.removeCover}</button> : null}
            <p className="text-xs text-fg-3">{t.create.coverAiDesc.replace("10", String(CREDIT_COST.aiCover))}</p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
