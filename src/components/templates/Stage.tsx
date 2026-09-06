"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { SlideView } from "@/lib/render/Slide";
import type { ResolvedStyle } from "@/lib/render/Slide";
import { CANVAS, PAD, type Layer } from "@/lib/layers/types";
import { SIZES, type Aspect, type Slide, type Template } from "@/lib/types";

type Drag = { kind: "move" | "resize"; handle?: string; startX: number; startY: number; orig: { x: number; y: number; w: number; h: number }; id: string };
const SNAP = 8;
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

/** Stage escalável: desenha o card real e, por cima, as caixas de seleção/arrasto de cada camada. */
export function Stage({ template, layers, style, slide, index, total, aspect, selectedId, onSelect, onChange, onCommit, coverImage }: {
  template: Template;
  layers: Layer[];
  style: ResolvedStyle;
  slide: Slide;
  index: number;
  total: number;
  aspect: Aspect;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Layer>) => void;
  onCommit: () => void;
  coverImage?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const { w, h } = SIZES[aspect];
  const yScale = h / CANVAS.h;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  const toCanvas = (px: number) => px / scale;

  function snapTo(v: number, size: number, others: number[][], axis: "x" | "y") {
    const limit = axis === "x" ? CANVAS.w : CANVAS.h;
    const cands = [0, PAD, limit / 2 - size / 2, limit - PAD - size, limit - size, ...others.flatMap(([a, b]) => [a, b - size, a + (b - a) / 2 - size / 2])];
    let best = v, guide: number | undefined, dist = SNAP;
    for (const c of cands) {
      const d = Math.abs(c - v);
      if (d < dist) {
        dist = d;
        best = c;
        guide = c + (c === limit / 2 - size / 2 ? size / 2 : 0);
      }
    }
    return { v: Math.round(best), guide };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = toCanvas(e.clientX - drag.startX);
    const dy = toCanvas(e.clientY - drag.startY) / yScale;
    const o = drag.orig;
    if (drag.kind === "move") {
      const others = layers.filter((l) => l.id !== drag.id && !l.hidden);
      const sx = snapTo(o.x + dx, o.w, others.map((l) => [l.x, l.x + l.w]), "x");
      const sy = snapTo(o.y + dy, o.h, others.map((l) => [l.y, l.y + l.h]), "y");
      setGuides({ x: sx.guide, y: sy.guide });
      onChange(drag.id, { x: sx.v, y: sy.v });
      return;
    }
    let { x, y, w: lw, h: lh } = o;
    const hd = drag.handle ?? "se";
    if (hd.includes("e")) lw = Math.max(20, o.w + dx);
    if (hd.includes("s")) lh = Math.max(20, o.h + dy);
    if (hd.includes("w")) { lw = Math.max(20, o.w - dx); x = o.x + o.w - lw; }
    if (hd.includes("n")) { lh = Math.max(20, o.h - dy); y = o.y + o.h - lh; }
    onChange(drag.id, { x: Math.round(x), y: Math.round(y), w: Math.round(lw), h: Math.round(lh) });
  }

  function endDrag() {
    if (!drag) return;
    setDrag(null);
    setGuides({});
    onCommit();
  }

  const start = (e: React.PointerEvent, layer: Layer, kind: Drag["kind"], handle?: string) => {
    if (layer.locked && kind === "resize") return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    onSelect(layer.id);
    if (layer.locked) return;
    setDrag({ kind, handle, startX: e.clientX, startY: e.clientY, orig: { x: layer.x, y: layer.y, w: layer.w, h: layer.h }, id: layer.id });
  };

  return (
    <div ref={ref} className="relative w-full select-none overflow-hidden rounded-xl border border-line bg-bg-3 shadow-2xl shadow-black/50" style={{ aspectRatio: `${w} / ${h}`, touchAction: "none" }} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerDown={() => onSelect(null)}>
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
        <SlideView template={template} slide={slide} index={index} total={total} aspect={aspect} style={style} coverImage={coverImage} authorName="Você" />
      </div>
      {/* guias */}
      {guides.x !== undefined ? <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-pink" style={{ left: guides.x * scale }} /> : null}
      {guides.y !== undefined ? <div className="pointer-events-none absolute left-0 right-0 h-px bg-pink" style={{ top: guides.y * yScale * scale }} /> : null}
      {/* margem segura */}
      <div className="pointer-events-none absolute border border-dashed border-fg/10" style={{ left: PAD * scale, top: PAD * yScale * scale, width: (CANVAS.w - PAD * 2) * scale, height: (CANVAS.h - PAD * 2) * yScale * scale }} />
      {layers.map((l) => {
        if (l.hidden) return null;
        const sel = l.id === selectedId;
        const box = { left: l.x * scale, top: l.y * yScale * scale, width: l.w * scale, height: l.h * yScale * scale };
        return (
          <div key={l.id} className={clsx("absolute", sel ? "z-20" : "z-10")} style={box}>
            <div
              className={clsx("absolute inset-0 rounded-sm border", sel ? "border-lime" : "border-transparent hover:border-lime/50", l.locked ? "cursor-default" : "cursor-move")}
              onPointerDown={(e) => start(e, l, "move")}
              onDoubleClick={() => onSelect(l.id)}
              title={l.name ?? l.id}
            />
            {sel && !l.locked
              ? HANDLES.map((hd) => (
                  <div
                    key={hd}
                    onPointerDown={(e) => start(e, l, "resize", hd)}
                    className="absolute z-30 h-3 w-3 rounded-sm border border-black bg-lime"
                    style={{
                      left: hd.includes("w") ? -6 : hd.includes("e") ? "calc(100% - 6px)" : "calc(50% - 6px)",
                      top: hd.includes("n") ? -6 : hd.includes("s") ? "calc(100% - 6px)" : "calc(50% - 6px)",
                      cursor: `${hd}-resize`,
                    }}
                  />
                ))
              : null}
            {sel ? <div className="pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded bg-lime px-1.5 py-0.5 text-[10px] font-bold text-black">{l.name ?? l.id} · {Math.round(l.w)}×{Math.round(l.h)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
