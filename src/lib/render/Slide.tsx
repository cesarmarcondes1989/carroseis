/* eslint-disable @next/next/no-img-element */
import type { Aspect, BrandOverrides, Palette, Slide as SlideData, Template } from "@/lib/types";
import { SIZES } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

/**
 * Componente de slide compatível com Satori: só div/span/img, inline styles,
 * todo div com mais de um filho é display:flex. O mesmo componente serve o
 * preview no navegador e o render dos PNGs no servidor.
 */

export type ResolvedStyle = {
  palette: Palette;
  fontDisplay: string;
  fontBody: string;
  scale: number;
  handle: string | null;
  variant: "dark" | "light";
};

export function resolveStyle(template: Template, overrides?: BrandOverrides | null, handleFallback?: string | null): ResolvedStyle {
  const palette: Palette = { ...template.palette, ...(overrides?.palette ?? {}) } as Palette;
  if (overrides?.palette?.cycle === undefined && template.palette.cycle && overrides?.palette?.bg) {
    // usuário trocou a cor base do Full Texto: regenera o ciclo a partir dela
    palette.cycle = [overrides.palette.bg, template.palette.accent2, ...template.palette.cycle.slice(2)];
  }
  return {
    palette,
    fontDisplay: overrides?.font_display || template.fonts.display,
    fontBody: overrides?.font_body || template.fonts.body,
    scale: overrides?.text_scale ?? 1,
    handle: overrides?.instagram_handle ?? handleFallback ?? null,
    variant: overrides?.variant ?? (isLight(palette.bg) ? "light" : "dark"),
  };
}

export function isLight(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export type SlideProps = {
  template: Template;
  slide: SlideData;
  index: number;
  total: number;
  aspect: Aspect;
  style: ResolvedStyle;
  coverImage?: string | null;
  authorName?: string | null;
  avatarUrl?: string | null;
};

const PAD = 80;

function Words({ text, size, font, color, accent, weight = 700, lineHeight = 1.05, uppercase = false, highlight = true }: {
  text: string; size: number; font: string; color: string; accent: string; weight?: number; lineHeight?: number; uppercase?: boolean; highlight?: boolean
}) {
  // **palavra** ganha bloco de cor atrás
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const items: ReactNode[] = [];
  let k = 0;
  for (const part of parts) {
    const marked = part.startsWith("**") && part.endsWith("**");
    const hl = highlight && marked;
    const clean = marked ? part.slice(2, -2) : part;
    for (const w of clean.split(/\s+/).filter(Boolean)) {
      items.push(
        <span
          key={k++}
          style={{
            fontFamily: font,
            fontSize: size,
            fontWeight: weight,
            color: hl ? (isLight(accent) ? "#0a0a0a" : "#ffffff") : color,
            backgroundColor: hl ? accent : "transparent",
            lineHeight,
            padding: hl ? `0 ${size * 0.14}px` : 0,
            marginRight: size * 0.26,
            marginBottom: hl ? size * 0.12 : 0,
            textTransform: uppercase ? "uppercase" : "none",
            letterSpacing: uppercase ? -0.5 : -size * 0.02,
          }}
        >
          {uppercase ? w.toUpperCase() : w}
        </span>,
      );
    }
  }
  return <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end" }}>{items}</div>;
}

function Body({ text, size, font, color, lineHeight = 1.35 }: { text: string; size: number; font: string; color: string; lineHeight?: number; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {text.split(/\n+/).map((p, i) => (
        <span key={i} style={{ fontFamily: font, fontSize: size, color, lineHeight, marginBottom: size * 0.5 }}>
          {p}
        </span>
      ))}
    </div>
  );
}

function Pill({ text, bg, fg, font, size = 26 }: { text: string; bg: string; fg: string; font: string; size?: number }) {
  return (
    <div style={{ display: "flex", backgroundColor: bg, color: fg, fontFamily: font, fontSize: size, fontWeight: 700, padding: `${size * 0.4}px ${size * 0.9}px`, borderRadius: 999, letterSpacing: 1, textTransform: "uppercase" }}>
      {text}
    </div>
  );
}

function Avatar({ name, url, size, bg, fg, font }: { name: string; url?: string | null; size: number; bg: string; fg: string; font: string }) {
  if (url) return <img src={url} width={size} height={size} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" }} alt="" />;
  return (
    <div style={{ display: "flex", width: size, height: size, borderRadius: 999, backgroundColor: bg, color: fg, alignItems: "center", justifyContent: "center", fontFamily: font, fontSize: size * 0.45, fontWeight: 700 }}>
      {name.trim().charAt(0).toUpperCase() || "•"}
    </div>
  );
}

function Footer({ style, index, total, tone }: { style: ResolvedStyle; index: number; total: number; tone: string }) {
  const { palette, fontBody, handle } = style;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      <span style={{ fontFamily: fontBody, fontSize: 28, color: tone, fontWeight: 700 }}>{handle ? `@${handle.replace(/^@/, "")}` : " "}</span>
      <div style={{ display: "flex", alignItems: "center" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ display: "flex", width: i === index ? 28 : 10, height: 10, borderRadius: 999, backgroundColor: i === index ? palette.accent : tone, opacity: i === index ? 1 : 0.4, marginLeft: 8 }} />
        ))}
        {index < total - 1 ? <span style={{ fontFamily: fontBody, fontSize: 28, color: tone, marginLeft: 20, fontWeight: 700 }}>›</span> : null}
      </div>
    </div>
  );
}

function CoverImage({ src, gradientTo, strength = 0.85, height = "100%" }: { src: string; gradientTo: string; strength?: number; height?: string }) {
  return (
    <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height, overflow: "hidden" }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `linear-gradient(180deg, ${hexA(gradientTo, 0.05)} 0%, ${hexA(gradientTo, 0.15)} 40%, ${hexA(gradientTo, strength)} 78%, ${gradientTo} 100%)` }} />
    </div>
  );
}

export function hexA(hex: string, a: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function SlideView(props: SlideProps) {
  const { aspect } = props;
  const { w, h } = SIZES[aspect];
  const root: CSSProperties = { display: "flex", width: w, height: h, position: "relative", overflow: "hidden" };
  switch (props.template.layout) {
    case "social":
      return <div style={root}>{Social(props)}</div>;
    case "insider":
      return <div style={root}>{Insider(props)}</div>;
    case "identity":
      return <div style={root}>{Identity(props)}</div>;
    case "fulltext":
      return <div style={root}>{FullText(props)}</div>;
    case "news":
      return <div style={root}>{News(props)}</div>;
    default:
      return <div style={root}>{Niche(props)}</div>;
  }
}

/* ------------------------------------------------------------------ social */
function Social({ slide, index, total, style, authorName, avatarUrl }: SlideProps) {
  const { palette, fontBody, scale, handle } = style;
  const name = authorName || handle || "Seu nome";
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.bg, padding: PAD, justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", backgroundColor: palette.accent2, borderRadius: 40, padding: 56, border: `2px solid ${hexA(palette.muted, 0.25)}` }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar name={name} url={avatarUrl} size={96} bg={palette.accent} fg="#fff" font={fontBody} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 24 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: fontBody, fontSize: 34, fontWeight: 700, color: palette.fg }}>{name}</span>
              <div style={{ display: "flex", width: 28, height: 28, borderRadius: 999, backgroundColor: palette.accent, marginLeft: 12, alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>✓</span>
              </div>
            </div>
            <span style={{ fontFamily: fontBody, fontSize: 28, color: palette.muted }}>{handle ? `@${handle.replace(/^@/, "")}` : "@perfil"}</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <Words text={slide.titulo} size={56 * scale} font={fontBody} color={palette.fg} accent={palette.accent} weight={700} lineHeight={1.2} />
        </div>
        {slide.texto ? (
          <div style={{ display: "flex", marginTop: 24 }}>
            <Body text={slide.texto} size={36 * scale} font={fontBody} color={palette.muted} />
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 28, alignItems: "center" }}>
          <span style={{ fontFamily: fontBody, fontSize: 26, color: palette.muted }}>{`${index + 1} de ${total}`}</span>
          <span style={{ fontFamily: fontBody, fontSize: 26, color: palette.muted, marginLeft: 20 }}>·</span>
          <span style={{ fontFamily: fontBody, fontSize: 26, color: palette.accent, marginLeft: 20, fontWeight: 700 }}>{slide.etiqueta || "Instagram"}</span>
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 40 }}>
        <Footer style={style} index={index} total={total} tone={palette.muted} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- insider */
function Insider({ slide, index, total, style, coverImage }: SlideProps) {
  const { palette, fontDisplay, fontBody, scale, variant } = style;
  const bg = variant === "light" ? "#f7f7f5" : palette.bg;
  const fg = variant === "light" ? "#0a0a0a" : palette.fg;
  const muted = variant === "light" ? "#57534e" : palette.muted;
  const isCover = index === 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: bg, padding: PAD, justifyContent: "space-between" }}>
      {isCover && coverImage ? <CoverImage src={coverImage} gradientTo={bg} strength={0.9} height="70%" /> : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
        <Pill text={slide.etiqueta || (isCover ? "Insider" : `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`)} bg={palette.accent} fg="#0a0a0a" font={fontBody} />
        <span style={{ fontFamily: fontDisplay, fontSize: 40, color: muted, letterSpacing: 2 }}>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ display: "flex", width: 120, height: 8, backgroundColor: palette.accent, marginBottom: 32 }} />
        <Words text={slide.titulo} size={(isCover ? 128 : 100) * scale} font={fontDisplay} color={fg} accent={palette.accent} weight={400} uppercase lineHeight={0.95} />
        {slide.texto ? (
          <div style={{ display: "flex", marginTop: 32 }}>
            <Body text={slide.texto} size={38 * scale} font={fontBody} color={muted} />
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", position: "relative" }}>
        <Footer style={style} index={index} total={total} tone={muted} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- identity */
function Identity({ slide, index, total, style, coverImage, authorName, avatarUrl }: SlideProps) {
  const { palette, fontDisplay, fontBody, scale, handle } = style;
  const name = authorName || (handle ? handle.replace(/^@/, "") : "Seu nome");
  const isCover = index === 0;
  const chip = (
    <div style={{ display: "flex", alignItems: "center", backgroundColor: hexA("#000000", 0.45), borderRadius: 999, padding: "12px 28px 12px 12px" }}>
      <Avatar name={name} url={avatarUrl} size={72} bg={palette.accent} fg="#111" font={fontBody} />
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 18 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: fontBody, fontSize: 30, fontWeight: 700, color: "#fff" }}>{name}</span>
          <div style={{ display: "flex", width: 24, height: 24, borderRadius: 999, backgroundColor: palette.accent, marginLeft: 10, alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#111", fontSize: 16, fontWeight: 700 }}>✓</span>
          </div>
        </div>
        {handle ? <span style={{ fontFamily: fontBody, fontSize: 24, color: "#d4d4d8" }}>{`@${handle.replace(/^@/, "")}`}</span> : null}
      </div>
    </div>
  );
  if (isCover) {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.bg, padding: PAD, justifyContent: "space-between" }}>
        {coverImage ? <CoverImage src={coverImage} gradientTo={palette.bg} strength={0.92} /> : (
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `linear-gradient(160deg, ${palette.accent2} 0%, ${palette.bg} 60%, ${hexA(palette.accent, 0.25)} 100%)` }} />
        )}
        <div style={{ display: "flex", position: "relative" }}>{chip}</div>
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          {slide.etiqueta ? <div style={{ display: "flex", marginBottom: 24 }}><Pill text={slide.etiqueta} bg={palette.accent} fg="#111" font={fontBody} /></div> : null}
          <Words text={slide.titulo} size={104 * scale} font={fontDisplay} color="#fff" accent={palette.accent} weight={700} lineHeight={1.02} />
          {slide.texto ? <div style={{ display: "flex", marginTop: 24 }}><Body text={slide.texto} size={36 * scale} font={fontBody} color="#e4e4e7" /></div> : null}
          <div style={{ display: "flex", marginTop: 40 }}><Footer style={style} index={index} total={total} tone="#e4e4e7" /></div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.bg, padding: PAD, justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {chip}
        <span style={{ fontFamily: fontDisplay, fontSize: 36, color: palette.muted, fontWeight: 700 }}>{`${index + 1}/${total}`}</span>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", width: 10, backgroundColor: palette.accent, borderRadius: 8, marginRight: 40 }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {slide.etiqueta ? <span style={{ fontFamily: fontBody, fontSize: 28, color: palette.accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>{slide.etiqueta}</span> : null}
          <Words text={slide.titulo} size={80 * scale} font={fontDisplay} color={palette.fg} accent={palette.accent} weight={700} lineHeight={1.05} />
          {slide.texto ? <div style={{ display: "flex", marginTop: 28 }}><Body text={slide.texto} size={38 * scale} font={fontBody} color={palette.muted} /></div> : null}
        </div>
      </div>
      <Footer style={style} index={index} total={total} tone={palette.muted} />
    </div>
  );
}

/* ---------------------------------------------------------------- fulltext */
function FullText({ slide, index, total, style }: SlideProps) {
  const { palette, fontDisplay, fontBody, scale } = style;
  const cycle = palette.cycle && palette.cycle.length ? palette.cycle : [palette.bg, palette.accent2];
  const bg = cycle[index % cycle.length];
  const fg = isLight(bg) ? "#0a0a0a" : "#ffffff";
  const soft = isLight(bg) ? hexA("#000000", 0.55) : hexA("#ffffff", 0.75);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: bg, padding: PAD, justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: fontDisplay, fontSize: 64, color: fg, opacity: 0.35 }}>{String(index + 1).padStart(2, "0")}</span>
        {slide.etiqueta ? <Pill text={slide.etiqueta} bg={fg} fg={bg} font={fontBody} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Words text={slide.titulo} size={(index === 0 ? 116 : 96) * scale} font={fontDisplay} color={fg} accent={palette.accent} weight={400} lineHeight={1.0} highlight={false} />
        {slide.texto ? <div style={{ display: "flex", marginTop: 36 }}><Body text={slide.texto} size={42 * scale} font={fontBody} color={soft} /></div> : null}
      </div>
      <Footer style={{ ...style, palette: { ...palette, accent: fg } }} index={index} total={total} tone={soft} />
    </div>
  );
}

/* ------------------------------------------------------------------- niche */
function Niche({ slide, index, total, style, coverImage }: SlideProps) {
  const { palette, fontDisplay, fontBody, scale } = style;
  const isCover = index === 0;
  const isLast = index === total - 1 && total > 1;
  if (isCover) {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.bg, padding: PAD, justifyContent: "flex-end" }}>
        {coverImage ? <CoverImage src={coverImage} gradientTo={palette.bg} strength={0.9} /> : (
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `linear-gradient(145deg, ${palette.accent2} 0%, ${palette.bg} 55%, ${hexA(palette.accent, 0.35)} 100%)` }} />
        )}
        {!coverImage ? <div style={{ display: "flex", position: "absolute", top: -200, right: -200, width: 640, height: 640, borderRadius: 999, backgroundColor: hexA(palette.accent, 0.18) }} /> : null}
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ display: "flex", marginBottom: 28 }}>
            <Pill text={slide.etiqueta || "Arraste ›"} bg={palette.accent} fg={isLight(palette.accent) ? "#0a0a0a" : "#ffffff"} font={fontBody} />
          </div>
          <Words text={slide.titulo} size={104 * scale} font={fontDisplay} color={palette.fg} accent={palette.accent} weight={700} lineHeight={1.02} />
          {slide.texto ? <div style={{ display: "flex", marginTop: 24 }}><Body text={slide.texto} size={38 * scale} font={fontBody} color={palette.muted} /></div> : null}
          <div style={{ display: "flex", marginTop: 44 }}><Footer style={style} index={index} total={total} tone={palette.muted} /></div>
        </div>
      </div>
    );
  }
  if (isLast) {
    const fg = isLight(palette.accent) ? "#0a0a0a" : "#ffffff";
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.accent, padding: PAD, justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}><Pill text={slide.etiqueta || "Salva esse post"} bg={fg} fg={palette.accent} font={fontBody} /></div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Words text={slide.titulo} size={96 * scale} font={fontDisplay} color={fg} accent={palette.bg} weight={700} lineHeight={1.02} />
          {slide.texto ? <div style={{ display: "flex", marginTop: 28 }}><Body text={slide.texto} size={40 * scale} font={fontBody} color={hexA(fg, 0.8)} /></div> : null}
        </div>
        <Footer style={{ ...style, palette: { ...palette, accent: fg } }} index={index} total={total} tone={hexA(fg, 0.8)} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.bg, padding: PAD, justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 72, height: 72, borderRadius: 20, backgroundColor: palette.accent, alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: fontDisplay, fontSize: 36, fontWeight: 700, color: isLight(palette.accent) ? "#0a0a0a" : "#fff" }}>{String(index + 1).padStart(2, "0")}</span>
          </div>
          {slide.etiqueta ? <span style={{ fontFamily: fontBody, fontSize: 28, color: palette.accent, fontWeight: 700, marginLeft: 20, letterSpacing: 2, textTransform: "uppercase" }}>{slide.etiqueta}</span> : null}
        </div>
        <span style={{ fontFamily: fontBody, fontSize: 28, color: palette.muted }}>{`${index + 1}/${total}`}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Words text={slide.titulo} size={80 * scale} font={fontDisplay} color={palette.fg} accent={palette.accent} weight={700} lineHeight={1.05} />
        <div style={{ display: "flex", width: 96, height: 6, backgroundColor: palette.accent, marginTop: 32, marginBottom: 32, borderRadius: 4 }} />
        {slide.texto ? <Body text={slide.texto} size={40 * scale} font={fontBody} color={palette.muted} /> : null}
      </div>
      <Footer style={style} index={index} total={total} tone={palette.muted} />
    </div>
  );
}

/* -------------------------------------------------------------------- news */
function News({ slide, index, total, style, coverImage }: SlideProps) {
  const { palette, fontDisplay, fontBody, scale } = style;
  const isCover = index === 0;
  const tagFg = isLight(palette.accent) ? "#0a0a0a" : "#ffffff";
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: palette.bg, padding: PAD, justifyContent: isCover ? "flex-end" : "space-between" }}>
      {isCover && coverImage ? <CoverImage src={coverImage} gradientTo={palette.bg} strength={0.95} /> : null}
      {!isCover ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: 16, height: 48, backgroundColor: palette.accent }} />
            <span style={{ fontFamily: fontBody, fontSize: 30, fontWeight: 700, color: palette.fg, marginLeft: 20, letterSpacing: 3, textTransform: "uppercase" }}>{slide.etiqueta || "Continua"}</span>
          </div>
          <span style={{ fontFamily: fontBody, fontSize: 28, color: palette.muted }}>{`${index + 1}/${total}`}</span>
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        {isCover ? <div style={{ display: "flex", marginBottom: 28 }}><Pill text={slide.etiqueta || "Urgente"} bg={palette.accent} fg={tagFg} font={fontBody} size={30} /></div> : null}
        <Words text={slide.titulo} size={(isCover ? 112 : 84) * scale} font={fontDisplay} color={palette.fg} accent={palette.accent} weight={isCover ? 400 : 700} uppercase={fontDisplay === "Anton"} lineHeight={1.0} />
        {slide.texto ? <div style={{ display: "flex", marginTop: 28 }}><Body text={slide.texto} size={40 * scale} font={fontBody} color={palette.muted} /></div> : null}
        <div style={{ display: "flex", marginTop: 44 }}><Footer style={style} index={index} total={total} tone={palette.muted} /></div>
      </div>
    </div>
  );
}
