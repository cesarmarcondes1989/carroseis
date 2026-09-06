"use client";
import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Layer } from "@/lib/layers/types";
import { resolveColor } from "@/lib/layers/LayerCanvas";
import type { Palette } from "@/lib/types";
import { Spinner } from "@/components/ui";

const TOKENS = ["bg", "fg", "accent", "muted", "accent2", "auto"];

function Num({ label, value, onChange, step = 1, min, max }: { label: string; value: number | undefined; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <label className="block text-xs">
      <span className="text-fg-3">{label}</span>
      <input type="number" className="input mt-0.5 py-1 text-sm" value={value ?? 0} step={step} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Color({ label, value, onChange, palette, hint }: { label: string; value: string; onChange: (v: string) => void; palette: Palette; hint: string }) {
  const [name, alpha] = (value ?? "fg").split("@");
  const isToken = TOKENS.includes(name);
  const resolved = resolveColor(value, palette);
  return (
    <div className="text-xs">
      <span className="text-fg-3">{label}</span>
      <div className="mt-0.5 flex items-center gap-1">
        <span className="inline-block h-6 w-6 shrink-0 rounded border border-line" style={{ background: resolved }} />
        <select className="input py-1 text-sm" value={isToken ? name : "hex"} onChange={(e) => onChange(e.target.value === "hex" ? (isToken ? resolved.slice(0, 7) : name) : e.target.value + (alpha ? `@${alpha}` : ""))}>
          {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value="hex">hex</option>
        </select>
        {!isToken ? <input type="color" className="h-7 w-9 cursor-pointer rounded border border-line bg-transparent" value={/^#[0-9a-f]{6}$/i.test(name) ? name : "#ffffff"} onChange={(e) => onChange(e.target.value + (alpha ? `@${alpha}` : ""))} /> : null}
        <input type="number" className="input w-16 py-1 text-sm" title="alpha" min={0} max={1} step={0.05} value={alpha ?? 1} onChange={(e) => onChange(Number(e.target.value) >= 1 ? name : `${name}@${e.target.value}`)} />
      </div>
      <span className="text-[10px] text-fg-3">{hint}</span>
    </div>
  );
}

export function LayerProps({ layer, palette, fonts, onChange }: { layer: Layer; palette: Palette; fonts: { display: string; body: string }; onChange: (patch: Partial<Layer>) => void }) {
  const { t } = useI18n();
  const f = t.editor.fields;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const set = (patch: Record<string, unknown>) => onChange(patch as Partial<Layer>);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/templates/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) set({ src: data.url, useCover: false });
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs"><span className="text-fg-3">Nome</span><input className="input mt-0.5 py-1 text-sm" value={layer.name ?? ""} placeholder={layer.id} onChange={(e) => set({ name: e.target.value || undefined })} /></label>
      <div className="grid grid-cols-4 gap-2">
        <Num label={f.x} value={layer.x} onChange={(v) => set({ x: v })} />
        <Num label={f.y} value={layer.y} onChange={(v) => set({ y: v })} />
        <Num label={f.w} value={layer.w} onChange={(v) => set({ w: Math.max(1, v) })} />
        <Num label={f.h} value={layer.h} onChange={(v) => set({ h: Math.max(1, v) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Num label={f.opacity} value={layer.opacity ?? 1} step={0.05} min={0} max={1} onChange={(v) => set({ opacity: v })} />
        <Num label={f.rotate} value={layer.rotate ?? 0} min={-360} max={360} onChange={(v) => set({ rotate: v || undefined })} />
      </div>

      {layer.type === "text" ? (
        <>
          <label className="block text-xs"><span className="text-fg-3">{f.text}</span><textarea className="input mt-0.5 min-h-16 py-1 text-sm" value={layer.text} onChange={(e) => set({ text: e.target.value })} /></label>
          <div className="grid grid-cols-3 gap-2">
            <Num label={f.size} value={layer.size} min={8} max={400} onChange={(v) => set({ size: v })} />
            <label className="block text-xs"><span className="text-fg-3">{f.font}</span>
              <select className="input mt-0.5 py-1 text-sm" value={layer.font} onChange={(e) => set({ font: e.target.value })}><option value="display">{fonts.display}</option><option value="body">{fonts.body}</option></select></label>
            <label className="block text-xs"><span className="text-fg-3">{f.weight}</span>
              <select className="input mt-0.5 py-1 text-sm" value={layer.weight} onChange={(e) => set({ weight: Number(e.target.value) })}><option value={400}>400</option><option value={700}>700</option></select></label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs"><span className="text-fg-3">{f.align}</span>
              <select className="input mt-0.5 py-1 text-sm" value={layer.align} onChange={(e) => set({ align: e.target.value })}><option value="left">←</option><option value="center">↔</option><option value="right">→</option></select></label>
            <label className="block text-xs"><span className="text-fg-3">{f.valign}</span>
              <select className="input mt-0.5 py-1 text-sm" value={layer.valign} onChange={(e) => set({ valign: e.target.value })}><option value="top">↑</option><option value="middle">↕</option><option value="bottom">↓</option></select></label>
            <Num label={f.lineHeight} value={layer.lineHeight} step={0.05} min={0.7} max={2.5} onChange={(v) => set({ lineHeight: v })} />
          </div>
          <Color label={f.color} value={layer.color} onChange={(v) => set({ color: v })} palette={palette} hint={t.editor.colorHint} />
          <div className="grid grid-cols-2 gap-2">
            <Num label={f.letterSpacing} value={layer.letterSpacing ?? 0} step={0.5} min={-20} max={40} onChange={(v) => set({ letterSpacing: v })} />
            <label className="flex items-end gap-2 pb-1 text-xs"><input type="checkbox" className="accent-lime" checked={!!layer.uppercase} onChange={(e) => set({ uppercase: e.target.checked })} /> {f.uppercase}</label>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-lime" checked={!!layer.highlight} onChange={(e) => set({ highlight: e.target.checked })} /> {f.highlight}</label>
          {layer.highlight ? <Color label={`${f.highlight} · ${f.color}`} value={layer.highlightColor ?? "accent"} onChange={(v) => set({ highlightColor: v })} palette={palette} hint={t.editor.colorHint} /> : null}
        </>
      ) : null}

      {layer.type === "shape" ? (
        <>
          <label className="block text-xs"><span className="text-fg-3">{f.shape}</span>
            <select className="input mt-0.5 py-1 text-sm" value={layer.shape} onChange={(e) => set({ shape: e.target.value })}><option value="rect">rect</option><option value="circle">circle</option><option value="line">line</option></select></label>
          {layer.fill.startsWith("linear-gradient") || layer.fill.startsWith("radial-gradient") ? (
            <label className="block text-xs"><span className="text-fg-3">{f.fill}</span><input className="input mt-0.5 py-1 font-mono text-xs" value={layer.fill} onChange={(e) => set({ fill: e.target.value })} /></label>
          ) : (
            <Color label={f.fill} value={layer.fill} onChange={(v) => set({ fill: v })} palette={palette} hint={t.editor.colorHint} />
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => set({ fill: layer.fill.startsWith("linear-gradient") ? "accent" : "linear-gradient(145deg, accent2 0%, bg 55%, accent@0.35 100%)" })}>{layer.fill.startsWith("linear-gradient") ? "Cor sólida" : "Gradiente"}</button>
          <div className="grid grid-cols-3 gap-2">
            <Num label={f.radius} value={layer.radius ?? 0} min={0} max={600} onChange={(v) => set({ radius: v })} />
            <Num label={f.stroke} value={layer.strokeWidth ?? 0} min={0} max={60} onChange={(v) => set({ strokeWidth: v || undefined, stroke: v ? layer.stroke ?? "fg" : undefined })} />
            {layer.strokeWidth ? <Color label={f.stroke} value={layer.stroke ?? "fg"} onChange={(v) => set({ stroke: v })} palette={palette} hint="" /> : null}
          </div>
        </>
      ) : null}

      {layer.type === "pill" ? (
        <>
          <label className="block text-xs"><span className="text-fg-3">{f.text}</span><input className="input mt-0.5 py-1 text-sm" value={layer.text} onChange={(e) => set({ text: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2">
            <Num label={f.size} value={layer.size} min={10} max={80} onChange={(v) => set({ size: v })} />
            <label className="block text-xs"><span className="text-fg-3">{f.font}</span>
              <select className="input mt-0.5 py-1 text-sm" value={layer.font} onChange={(e) => set({ font: e.target.value })}><option value="display">{fonts.display}</option><option value="body">{fonts.body}</option></select></label>
          </div>
          <Color label={f.fill} value={layer.fill} onChange={(v) => set({ fill: v })} palette={palette} hint={t.editor.colorHint} />
          <Color label={f.color} value={layer.color} onChange={(v) => set({ color: v })} palette={palette} hint="" />
        </>
      ) : null}

      {layer.type === "image" ? (
        <>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-lime" checked={!!layer.useCover} onChange={(e) => set({ useCover: e.target.checked })} /> {f.useCover}</label>
          {!layer.useCover ? (
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? <Spinner /> : `📷 ${t.editor.upload}`}</button>
              {layer.src ? <span className="truncate text-[10px] text-fg-3">{layer.src.split("/").pop()}</span> : null}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs"><span className="text-fg-3">{f.fit}</span>
              <select className="input mt-0.5 py-1 text-sm" value={layer.fit} onChange={(e) => set({ fit: e.target.value })}><option value="cover">cover</option><option value="contain">contain</option></select></label>
            <Num label={f.radius} value={layer.radius ?? 0} min={0} max={600} onChange={(v) => set({ radius: v })} />
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-lime" checked={!!layer.fade} onChange={(e) => set({ fade: e.target.checked ? "bg" : undefined })} /> {f.fade}</label>
          {layer.fade ? <Color label={f.fade} value={layer.fade} onChange={(v) => set({ fade: v })} palette={palette} hint="" /> : null}
        </>
      ) : null}

      {layer.type === "pagination" ? (
        <>
          <Color label={f.color} value={layer.color} onChange={(v) => set({ color: v })} palette={palette} hint={t.editor.colorHint} />
          <Color label={`${f.color} (ativo)`} value={layer.activeColor} onChange={(v) => set({ activeColor: v })} palette={palette} hint="" />
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-lime" checked={layer.arrow} onChange={(e) => set({ arrow: e.target.checked })} /> {f.arrow}</label>
        </>
      ) : null}
    </div>
  );
}
