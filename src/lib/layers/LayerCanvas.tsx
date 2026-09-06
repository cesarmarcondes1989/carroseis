/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import type { Palette, Slide } from "@/lib/types";
import { hexA, isLight } from "@/lib/render/color";
import { bindText, CANVAS, type Layer, type TextLayer } from "./types";

export type LayerCtx = {
  palette: Palette;
  fontDisplay: string;
  fontBody: string;
  scale: number;
  slide: Slide;
  index: number;
  total: number;
  handle?: string | null;
  coverImage?: string | null;
  /** largura/altura reais do card (1080x1350 ou 1080x1080) */
  w: number;
  h: number;
};

/** Resolve token da paleta, "auto" (contraste contra um fundo), "token@alpha" ou hex. */
export function resolveColor(ref: string | undefined, palette: Palette, against?: string): string {
  if (!ref) return palette.fg;
  const [name, alphaRaw] = ref.split("@");
  const alpha = alphaRaw !== undefined ? Number(alphaRaw) : undefined;
  let hex: string;
  if (name === "auto") hex = isLight(against ?? palette.bg) ? "#0a0a0a" : "#ffffff";
  else if (name in palette && typeof (palette as Record<string, unknown>)[name] === "string") hex = (palette as unknown as Record<string, string>)[name];
  else hex = name;
  return alpha !== undefined && !Number.isNaN(alpha) ? hexA(hex, alpha) : hex;
}

/** Gradientes podem citar tokens: "linear-gradient(145deg, accent2 0%, bg 55%, accent@0.35 100%)". */
export function resolveFill(fill: string, palette: Palette, against?: string) {
  if (fill.startsWith("linear-gradient(") || fill.startsWith("radial-gradient(")) {
    return fill.replace(/\b(bg|fg|accent2|accent|muted|auto)(@[\d.]+)?\b/g, (m) => resolveColor(m, palette, against));
  }
  return resolveColor(fill, palette, against);
}

const clip = (v: number) => Math.round(v * 100) / 100;

function TextBlock({ layer, ctx, text }: { layer: TextLayer; ctx: LayerCtx; text: string }) {
  const s = ctx.scale;
  const font = layer.font === "body" ? ctx.fontBody : ctx.fontDisplay;
  const size = layer.size * s;
  const color = resolveColor(layer.color, ctx.palette);
  const hlBg = resolveColor(layer.highlightColor ?? "accent", ctx.palette);
  const hlFg = isLight(hlBg) ? "#0a0a0a" : "#ffffff";
  const justify = layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start";
  const alignY = layer.valign === "middle" ? "center" : layer.valign === "bottom" ? "flex-end" : "flex-start";
  const lines = text.split(/\n/);
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: alignY, width: "100%", height: "100%" }}>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        const items: ReactNode[] = [];
        let k = 0;
        for (const part of parts) {
          const marked = part.startsWith("**") && part.endsWith("**");
          const hl = !!layer.highlight && marked;
          const clean = marked ? part.slice(2, -2) : part;
          for (const word of clean.split(/\s+/).filter(Boolean)) {
            items.push(
              <span
                key={k++}
                style={{
                  fontFamily: font,
                  fontSize: size,
                  fontWeight: layer.weight,
                  color: hl ? hlFg : color,
                  backgroundColor: hl ? hlBg : "transparent",
                  lineHeight: layer.lineHeight,
                  padding: hl ? `0 ${clip(size * 0.14)}px` : 0,
                  marginRight: clip(size * 0.26),
                  marginBottom: hl ? clip(size * 0.12) : 0,
                  letterSpacing: (layer.letterSpacing ?? -size * 0.02 / s) * s,
                  textTransform: layer.uppercase ? "uppercase" : "none",
                }}
              >
                {layer.uppercase ? word.toUpperCase() : word}
              </span>,
            );
          }
        }
        return (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: justify, alignItems: "flex-end", width: "100%" }}>
            {items.length ? items : <span style={{ fontFamily: font, fontSize: size, lineHeight: layer.lineHeight }}> </span>}
          </div>
        );
      })}
    </div>
  );
}

export function LayerNode({ layer, ctx }: { layer: Layer; ctx: LayerCtx }) {
  if (layer.hidden) return null;
  const s = ctx.scale;
  const box: CSSProperties = {
    display: "flex",
    position: "absolute",
    left: clip(layer.x * s),
    top: clip(layer.y * s),
    width: clip(layer.w * s),
    height: clip(layer.h * s),
    opacity: layer.opacity ?? 1,
    overflow: "hidden",
  };
  if (layer.rotate) box.transform = `rotate(${layer.rotate}deg)`;
  const { palette } = ctx;
  const bind = (t: string) => bindText(t, { titulo: ctx.slide.titulo, texto: ctx.slide.texto, etiqueta: ctx.slide.etiqueta, handle: ctx.handle, index: ctx.index, total: ctx.total });

  switch (layer.type) {
    case "text": {
      const text = bind(layer.text);
      if (text === null) return null;
      return (
        <div style={box}>
          <TextBlock layer={layer} ctx={ctx} text={text} />
        </div>
      );
    }
    case "shape": {
      const fill = resolveFill(layer.fill, palette);
      const radius = layer.shape === "circle" ? 9999 : (layer.radius ?? 0) * s;
      const style: CSSProperties = { ...box, borderRadius: radius, overflow: "visible" };
      if (fill.startsWith("linear-gradient(") || fill.startsWith("radial-gradient(")) style.backgroundImage = fill;
      else style.backgroundColor = fill;
      if (layer.stroke && layer.strokeWidth) {
        style.borderWidth = layer.strokeWidth * s;
        style.borderStyle = "solid";
        style.borderColor = resolveColor(layer.stroke, palette);
      }
      if (layer.shape === "line") style.height = Math.max(1, (layer.strokeWidth ?? 4) * s);
      return <div style={style} />;
    }
    case "pill": {
      const text = bind(layer.text);
      if (text === null) return null;
      const fill = resolveColor(layer.fill, palette);
      const color = resolveColor(layer.color, palette, fill);
      const size = layer.size * s;
      return (
        <div style={{ ...box, overflow: "visible" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: fill, color, fontFamily: layer.font === "body" ? ctx.fontBody : ctx.fontDisplay, fontSize: size, fontWeight: 700, padding: `${clip(size * 0.4)}px ${clip(size * 0.9)}px`, borderRadius: 999, letterSpacing: 1 * s, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {text}
          </div>
        </div>
      );
    }
    case "image": {
      const src = layer.useCover ? ctx.coverImage : layer.src;
      if (!src) return null;
      const radius = (layer.radius ?? 0) * s;
      return (
        <div style={{ ...box, borderRadius: radius }}>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: layer.fit }} />
          {layer.fade ? <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `linear-gradient(180deg, ${hexA(resolveColor(layer.fade, palette), 0.05)} 0%, ${hexA(resolveColor(layer.fade, palette), 0.15)} 40%, ${hexA(resolveColor(layer.fade, palette), 0.85)} 78%, ${resolveColor(layer.fade, palette)} 100%)` }} /> : null}
        </div>
      );
    }
    case "pagination": {
      const tone = resolveColor(layer.color, palette);
      const active = resolveColor(layer.activeColor, palette);
      const dot = 10 * s;
      return (
        <div style={{ ...box, alignItems: "center", justifyContent: "flex-end", overflow: "visible" }}>
          {Array.from({ length: ctx.total }).map((_, i) => (
            <div key={i} style={{ display: "flex", width: i === ctx.index ? dot * 2.8 : dot, height: dot, borderRadius: 999, backgroundColor: i === ctx.index ? active : tone, opacity: i === ctx.index ? 1 : 0.4, marginLeft: 8 * s }} />
          ))}
          {layer.arrow && ctx.index < ctx.total - 1 ? <span style={{ fontFamily: ctx.fontBody, fontSize: 28 * s, color: tone, marginLeft: 20 * s, fontWeight: 700 }}>›</span> : null}
        </div>
      );
    }
  }
}

/** Desenha uma prancha inteira. Escala 1080x1350 → w x h (formato 1:1 comprime a altura). */
export function LayerCanvas({ layers, ctx }: { layers: Layer[]; ctx: Omit<LayerCtx, "scale"> }) {
  const scale = ctx.w / CANVAS.w;
  const yScale = ctx.h / CANVAS.h;
  const full: LayerCtx = { ...ctx, scale };
  return (
    <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: ctx.w, height: ctx.h, overflow: "hidden" }}>
      {layers.map((l) => {
        const adjusted = yScale === 1 ? l : { ...l, y: l.y * yScale, h: l.h * yScale };
        return <LayerNode key={l.id} layer={adjusted} ctx={full} />;
      })}
    </div>
  );
}
