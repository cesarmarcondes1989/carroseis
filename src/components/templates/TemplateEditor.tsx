"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { newId, PAD, CANVAS, type Layer, type LayerTemplate, type Role } from "@/lib/layers/types";
import { resolveStyle } from "@/lib/render/Slide";
import { FONT_NAMES } from "@/lib/templates/registry";
import type { Aspect, Fonts, Palette, Slide, Template } from "@/lib/types";
import { Alert, Spinner } from "@/components/ui";
import { LayerProps } from "./LayerProps";
import { Stage } from "./Stage";

export type EditorDoc = { id: string | null; name: string; base: string; palette: Palette; fonts: Fonts; layers: LayerTemplate; supportsAiCover: boolean };

const SAMPLE: Record<Role, Slide> = {
  cover: { titulo: "6 hábitos que comprometem seu **sorriso**", texto: "E você nem percebe.", etiqueta: "Dentistas" },
  inner: { titulo: "Escovar com força", texto: "Pressão demais desgasta o esmalte e machuca a gengiva.", etiqueta: "Dica 2" },
  last: { titulo: "Salva esse post e marca alguém", texto: "Toda semana tem mais.", etiqueta: "CTA" },
};
const ROLE_INDEX: Record<Role, number> = { cover: 0, inner: 1, last: 4 };
const DEMO_COVER = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b3b52"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><circle cx="760" cy="420" r="260" fill="#f472b6" opacity="0.6"/></svg>')}`;

export function TemplateEditor({ initial, baseTemplate }: { initial: EditorDoc; baseTemplate: Template }) {
  const { t } = useI18n();
  const e = t.editor;
  const router = useRouter();
  const [doc, setDoc] = useState<EditorDoc>(initial);
  const [role, setRole] = useState<Role>("cover");
  const [selected, setSelected] = useState<string | null>(null);
  const [aspect, setAspect] = useState<Aspect>("4:5");
  const [sample, setSample] = useState<Record<Role, Slide>>(SAMPLE);
  const [handle, setHandle] = useState("seuperfil");
  const [tab, setTab] = useState<"layers" | "brand" | "agent">("layers");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [chat, setChat] = useState<{ who: "you" | "ai"; text: string }[]>([]);
  const history = useRef<{ past: EditorDoc[]; future: EditorDoc[] }>({ past: [], future: [] });
  const live = useRef(doc);
  useEffect(() => { live.current = doc; }, [doc]);

  const layers = doc.layers[role];
  const selectedLayer = layers.find((l) => l.id === selected) ?? null;
  const template: Template = useMemo(() => ({ ...baseTemplate, id: doc.id ? `user:${doc.id}` : "draft", name: doc.name, palette: doc.palette, fonts: doc.fonts, layers: doc.layers, custom: true, supports_ai_cover: doc.supportsAiCover }), [baseTemplate, doc]);
  const style = useMemo(() => resolveStyle(template, { instagram_handle: handle }), [template, handle]);

  /** Aplica sem gravar histórico (arrasto ao vivo). */
  const patchLive = useCallback((next: (d: EditorDoc) => EditorDoc) => {
    setDoc((d) => next(d));
    setDirty(true);
  }, []);
  /** Grava o estado anterior no histórico e aplica. */
  const commit = useCallback((next: (d: EditorDoc) => EditorDoc) => {
    history.current.past.push(live.current);
    if (history.current.past.length > 60) history.current.past.shift();
    history.current.future = [];
    patchLive(next);
  }, [patchLive]);
  const snapshot = useCallback(() => {
    // fim de um arrasto: o estado antes do arrasto já está em live? não: gravamos o atual como ponto de retorno
    history.current.future = [];
  }, []);
  const dragStart = useRef<EditorDoc | null>(null);

  const undo = () => {
    const prev = history.current.past.pop();
    if (!prev) return;
    history.current.future.push(live.current);
    setDoc(prev);
    setDirty(true);
  };
  const redo = () => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(live.current);
    setDoc(next);
    setDirty(true);
  };

  const setLayers = (fn: (ls: Layer[]) => Layer[], withHistory = true) => (withHistory ? commit : patchLive)((d) => ({ ...d, layers: { ...d.layers, [role]: fn(d.layers[role]) } }));
  const updateLayer = (id: string, patch: Partial<Layer>, withHistory = true) => setLayers((ls) => ls.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)), withHistory);

  function onStageChange(id: string, patch: Partial<Layer>) {
    if (!dragStart.current) dragStart.current = live.current;
    updateLayer(id, patch, false);
  }
  function onStageCommit() {
    if (dragStart.current) {
      history.current.past.push(dragStart.current);
      history.current.future = [];
      dragStart.current = null;
    }
    snapshot();
  }

  function addLayer(kind: string) {
    const base = { x: PAD, y: 400, w: CANVAS.w - PAD * 2, h: 200, id: newId() };
    const map: Record<string, Layer> = {
      title: { ...base, type: "text", text: "{titulo}", font: "display", size: 88, weight: 700, color: "fg", align: "left", valign: "bottom", lineHeight: 1.05, highlight: true, name: "Título" },
      text: { ...base, type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, name: "Texto" },
      free: { ...base, type: "text", text: "Seu texto aqui", font: "display", size: 48, weight: 700, color: "fg", align: "left", valign: "top", lineHeight: 1.1, h: 120, name: "Texto livre" },
      tag: { ...base, type: "pill", text: "{etiqueta}", fill: "accent", color: "auto", size: 26, font: "body", w: 300, h: 52, name: "Etiqueta" },
      handle: { ...base, type: "text", text: "{handle}", font: "body", size: 28, weight: 700, color: "muted", align: "left", valign: "bottom", lineHeight: 1, y: CANVAS.h - PAD - 40, w: 500, h: 40, name: "@" },
      pages: { ...base, type: "pagination", x: CANVAS.w - PAD - 300, y: CANVAS.h - PAD - 40, w: 300, h: 40, color: "muted", activeColor: "accent", arrow: true, name: "Paginação" },
      rect: { ...base, type: "shape", shape: "rect", fill: "accent", radius: 16, w: 300, h: 120, name: "Retângulo" },
      circle: { ...base, type: "shape", shape: "circle", fill: "accent@0.25", w: 400, h: 400, name: "Círculo" },
      line: { ...base, type: "shape", shape: "line", fill: "accent", strokeWidth: 6, w: 120, h: 6, name: "Linha" },
      image: { ...base, type: "image", src: null, fit: "cover", radius: 24, w: 400, h: 400, name: "Imagem" },
      cover: { ...base, type: "image", src: null, useCover: true, fit: "cover", fade: "bg", x: 0, y: 0, w: CANVAS.w, h: CANVAS.h, name: "Foto de capa" },
    };
    const l = map[kind];
    if (!l) return;
    setLayers((ls) => (kind === "cover" ? [l, ...ls] : [...ls, l]));
    setSelected(l.id);
  }

  const move = (id: string, dir: -1 | 1) => setLayers((ls) => { const i = ls.findIndex((l) => l.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= ls.length) return ls; const c = [...ls]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const duplicate = (id: string) => setLayers((ls) => { const l = ls.find((x) => x.id === id); if (!l) return ls; const c = { ...l, id: newId(), x: l.x + 24, y: l.y + 24, name: l.name ? `${l.name} 2` : undefined } as Layer; setSelected(c.id); return [...ls, c]; });
  const remove = (id: string) => { setLayers((ls) => ls.filter((l) => l.id !== id)); setSelected(null); };
  const copyFromCover = () => commit((d) => ({ ...d, layers: { ...d.layers, [role]: d.layers.cover.map((l) => ({ ...l, id: newId() }) as Layer) } }));

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      const tag = (ev.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); if (ev.shiftKey) redo(); else undo(); return; }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "y") { ev.preventDefault(); redo(); return; }
      if (!selected) return;
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "d") { ev.preventDefault(); duplicate(selected); return; }
      if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); remove(selected); return; }
      const step = ev.shiftKey ? 10 : 1;
      const l = live.current.layers[role].find((x) => x.id === selected);
      if (!l || l.locked) return;
      if (ev.key === "ArrowLeft") updateLayer(selected, { x: l.x - step });
      if (ev.key === "ArrowRight") updateLayer(selected, { x: l.x + step });
      if (ev.key === "ArrowUp") updateLayer(selected, { y: l.y - step });
      if (ev.key === "ArrowDown") updateLayer(selected, { y: l.y + step });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, role]);

  async function save() {
    setBusy("save");
    setMsg(null);
    const body = { id: doc.id ?? undefined, name: doc.name || "Meu template", base_template_id: doc.base, palette: doc.palette, fonts: doc.fonts, layers: doc.layers, supports_ai_cover: doc.supportsAiCover };
    const res = await fetch("/api/templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg({ kind: "error", text: data.error === "AGENCY_REQUIRED" ? t.templatesPage.locked : data.error ?? t.common.error });
    setDirty(false);
    setMsg({ kind: "ok", text: e.saved });
    if (!doc.id) {
      setDoc((d) => ({ ...d, id: data.template.user_template_id }));
      router.replace(`/app/templates/${data.template.user_template_id}`);
    }
  }

  async function askAgent() {
    const text = instruction.trim();
    if (!text) return;
    setBusy("agent");
    setChat((c) => [...c, { who: "you", text }]);
    setInstruction("");
    const res = await fetch("/api/templates/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction: text, role, layers, palette: doc.palette, fonts: doc.fonts, aspect }) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setChat((c) => [...c, { who: "ai", text: data.error ?? t.common.error }]);
    commit((d) => ({ ...d, layers: { ...d.layers, [role]: data.layers }, palette: data.palette ? { ...d.palette, ...data.palette } : d.palette }));
    setChat((c) => [...c, { who: "ai", text: data.message }]);
  }

  const total = 5;
  const index = ROLE_INDEX[role];

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[640px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/app/templates" className="text-xs text-fg-3 hover:text-fg">← {e.back}</Link>
        <input className="input w-64 py-1.5 font-display text-lg font-bold" value={doc.name} onChange={(ev) => patchLive((d) => ({ ...d, name: ev.target.value }))} placeholder={e.name} />
        <div className="flex gap-1 rounded-xl bg-bg-3 p-1">
          {(["cover", "inner", "last"] as Role[]).map((r) => <button key={r} onClick={() => { setRole(r); setSelected(null); }} className={clsx("rounded-lg px-3 py-1.5 text-sm font-bold", role === r ? "bg-bg text-fg" : "text-fg-2")}>{e.roles[r]}</button>)}
        </div>
        <div className="flex gap-1">{(["4:5", "1:1"] as Aspect[]).map((a) => <button key={a} onClick={() => setAspect(a)} className={clsx("btn btn-sm", aspect === a ? "btn-primary" : "btn-ghost")}>{a}</button>)}</div>
        <button className="btn btn-ghost btn-sm" onClick={undo} title="Ctrl+Z">↶ {e.undo}</button>
        <button className="btn btn-ghost btn-sm" onClick={redo} title="Ctrl+Y">↷ {e.redo}</button>
        <div className="ml-auto flex items-center gap-2">
          {dirty ? <span className="text-xs text-fg-3">{e.unsaved}</span> : null}
          <button className="btn btn-primary" onClick={save} disabled={busy === "save"}>{busy === "save" ? <><Spinner /> {e.saving}</> : e.save}</button>
        </div>
      </div>
      {msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* camadas */}
        <div className="card flex min-h-0 flex-col p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-fg-3">{e.layers}</span>
            <select className="input w-auto py-1 text-xs" value="" onChange={(ev) => { addLayer(ev.target.value); ev.target.value = ""; }}>
              <option value="">＋ {e.add}</option>
              {Object.entries(e.addItems).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto scrollbar-thin">
            {[...layers].reverse().map((l) => (
              <div key={l.id} onClick={() => setSelected(l.id)} className={clsx("flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs", selected === l.id ? "bg-lime/15 text-fg" : "text-fg-2 hover:bg-bg-3", l.hidden && "opacity-40")}>
                <span className="w-4 text-center text-fg-3">{{ text: "T", shape: "◼", pill: "◖", image: "▣", pagination: "•••" }[l.type]}</span>
                <span className="min-w-0 flex-1 truncate">{l.name ?? (l.type === "text" ? l.text.slice(0, 18) : l.id)}</span>
                <button title={e.hide} onClick={(ev) => { ev.stopPropagation(); updateLayer(l.id, { hidden: !l.hidden }); }} className="text-fg-3 hover:text-fg">{l.hidden ? "◌" : "◉"}</button>
                <button title={e.lock} onClick={(ev) => { ev.stopPropagation(); updateLayer(l.id, { locked: !l.locked }); }} className="text-fg-3 hover:text-fg">{l.locked ? "🔒" : "🔓"}</button>
              </div>
            ))}
          </div>
          {selectedLayer ? (
            <div className="mt-2 flex flex-wrap gap-1 border-t border-line pt-2">
              <button className="btn btn-ghost btn-sm !px-2" title={e.up} onClick={() => move(selectedLayer.id, 1)}>▲</button>
              <button className="btn btn-ghost btn-sm !px-2" title={e.down} onClick={() => move(selectedLayer.id, -1)}>▼</button>
              <button className="btn btn-ghost btn-sm !px-2" title={e.duplicateLayer} onClick={() => duplicate(selectedLayer.id)}>⧉</button>
              <button className="btn btn-danger btn-sm !px-2" title={e.delete} onClick={() => remove(selectedLayer.id)}>✕</button>
            </div>
          ) : null}
          {role !== "cover" ? <button className="btn btn-ghost btn-sm mt-2" onClick={copyFromCover}>{e.copyRole}</button> : null}
        </div>

        {/* stage */}
        <div className="flex min-h-0 flex-col items-center overflow-auto">
          <div className="w-full max-w-[520px]">
            <Stage template={template} layers={layers} style={style} slide={sample[role]} index={index} total={total} aspect={aspect} selectedId={selected} onSelect={setSelected} onChange={onStageChange} onCommit={onStageCommit} coverImage={DEMO_COVER} />
          </div>
          <details className="mt-3 w-full max-w-[520px] text-xs">
            <summary className="cursor-pointer text-fg-3">{e.preview}</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input className="input py-1" value={sample[role].titulo} onChange={(ev) => setSample({ ...sample, [role]: { ...sample[role], titulo: ev.target.value } })} />
              <input className="input py-1" value={sample[role].texto ?? ""} onChange={(ev) => setSample({ ...sample, [role]: { ...sample[role], texto: ev.target.value } })} />
              <input className="input py-1" value={sample[role].etiqueta ?? ""} onChange={(ev) => setSample({ ...sample, [role]: { ...sample[role], etiqueta: ev.target.value } })} />
              <input className="input py-1" value={handle} onChange={(ev) => setHandle(ev.target.value)} placeholder="@" />
            </div>
          </details>
        </div>

        {/* painel direito */}
        <div className="card flex min-h-0 flex-col p-3">
          <div className="flex gap-1 rounded-xl bg-bg-3 p-1">
            {(["layers", "brand", "agent"] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={clsx("flex-1 rounded-lg py-1.5 text-xs font-bold", tab === k ? "bg-bg text-fg" : "text-fg-2")}>{k === "layers" ? e.props : k === "brand" ? e.palette : `✨ ${e.agent}`}</button>)}
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            {tab === "layers" ? (selectedLayer ? <LayerProps layer={selectedLayer} palette={doc.palette} fonts={doc.fonts} onChange={(p) => updateLayer(selectedLayer.id, p)} /> : <p className="text-xs text-fg-3">Clique numa camada no stage ou na lista.</p>) : null}
            {tab === "brand" ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{e.palette}</div>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {(["bg", "fg", "accent", "muted", "accent2"] as const).map((k) => (
                      <label key={k} className="flex flex-col items-center gap-1 text-[10px] uppercase text-fg-3">
                        <input type="color" value={doc.palette[k]} onChange={(ev) => commit((d) => ({ ...d, palette: { ...d.palette, [k]: ev.target.value } }))} className="h-10 w-full cursor-pointer rounded-lg border border-line bg-transparent" />
                        {k}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{e.fonts}</div>
                  <label className="mt-2 block text-xs"><span className="text-fg-3">{e.fontDisplay}</span><select className="input mt-0.5 py-1 text-sm" value={doc.fonts.display} onChange={(ev) => commit((d) => ({ ...d, fonts: { ...d.fonts, display: ev.target.value } }))}>{FONT_NAMES.map((f) => <option key={f}>{f}</option>)}</select></label>
                  <label className="mt-2 block text-xs"><span className="text-fg-3">{e.fontBody}</span><select className="input mt-0.5 py-1 text-sm" value={doc.fonts.body} onChange={(ev) => commit((d) => ({ ...d, fonts: { ...d.fonts, body: ev.target.value } }))}>{FONT_NAMES.map((f) => <option key={f}>{f}</option>)}</select></label>
                </div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-lime" checked={doc.supportsAiCover} onChange={(ev) => commit((d) => ({ ...d, supportsAiCover: ev.target.checked }))} /> {e.aiCover}</label>
              </div>
            ) : null}
            {tab === "agent" ? (
              <div className="flex h-full flex-col">
                <p className="text-xs text-fg-3">{e.agentHint}</p>
                <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto text-xs">
                  {chat.map((m, i) => <div key={i} className={clsx("rounded-lg px-3 py-2", m.who === "you" ? "bg-bg-3 text-fg" : "bg-violet/15 text-fg")}>{m.who === "ai" ? "✨ " : ""}{m.text}</div>)}
                  {busy === "agent" ? <div className="rounded-lg bg-violet/15 px-3 py-2 text-fg-2"><Spinner /> {e.agentThinking}</div> : null}
                </div>
                <textarea className="input mt-2 min-h-20 text-sm" placeholder={e.agentPlaceholder} value={instruction} onChange={(ev) => setInstruction(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) askAgent(); }} />
                <button className="btn btn-primary btn-sm mt-2" onClick={askAgent} disabled={busy === "agent" || !instruction.trim()}>✨ {e.agentSend}</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
