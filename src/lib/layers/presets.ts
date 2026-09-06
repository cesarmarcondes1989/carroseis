import { CANVAS, PAD, type Layer, type LayerTemplate } from "./types";

const { w, h } = CANVAS;
const inner = w - PAD * 2;

const footer = (): Layer[] => [
  { id: "handle", type: "text", text: "{handle}", font: "body", size: 28, weight: 700, color: "muted", align: "left", valign: "bottom", lineHeight: 1, x: PAD, y: h - PAD - 40, w: 500, h: 40 },
  { id: "pages", type: "pagination", x: w - PAD - 300, y: h - PAD - 40, w: 300, h: 40, color: "muted", activeColor: "accent", arrow: true },
];

/** Tela em branco: só o rodapé. */
export const CLEAN_SHEET: LayerTemplate = {
  cover: [
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 96, weight: 700, color: "fg", align: "left", valign: "bottom", lineHeight: 1.02, highlight: true, x: PAD, y: h * 0.45, w: inner, h: h * 0.4 },
    ...footer(),
  ],
  inner: [
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 76, weight: 700, color: "fg", align: "left", valign: "top", lineHeight: 1.05, x: PAD, y: h * 0.3, w: inner, h: 320 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: h * 0.3 + 340, w: inner, h: 400 },
    ...footer(),
  ],
  last: [
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 88, weight: 700, color: "fg", align: "left", valign: "middle", lineHeight: 1.02, x: PAD, y: h * 0.3, w: inner, h: 400 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: h * 0.3 + 420, w: inner, h: 200 },
    ...footer(),
  ],
};

/** Nicho: pílula, título grande embaixo, número em bloco nos cards do meio, CTA em fundo de destaque. */
export const NICHE: LayerTemplate = {
  cover: [
    { id: "bg", type: "shape", shape: "rect", fill: "linear-gradient(145deg, accent2 0%, bg 55%, accent@0.35 100%)", x: 0, y: 0, w, h, locked: true, name: "Fundo" },
    { id: "blob", type: "shape", shape: "circle", fill: "accent@0.18", x: w - 440, y: -200, w: 640, h: 640, name: "Círculo" },
    { id: "foto", type: "image", src: null, useCover: true, fit: "cover", fade: "bg", x: 0, y: 0, w, h, name: "Capa do carrossel" },
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "accent", color: "auto", size: 26, font: "body", x: PAD, y: 640, w: 300, h: 52 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 104, weight: 700, color: "fg", align: "left", valign: "bottom", lineHeight: 1.02, highlight: true, x: PAD, y: 700, w: inner, h: 400 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.3, x: PAD, y: h - PAD - 160, w: inner, h: 100 },
    ...footer(),
  ],
  inner: [
    { id: "num", type: "shape", shape: "rect", fill: "accent", radius: 20, x: PAD, y: PAD, w: 72, h: 72, name: "Bloco do número" },
    { id: "numtxt", type: "text", text: "{n}", font: "display", size: 36, weight: 700, color: "auto", align: "center", valign: "middle", lineHeight: 1, x: PAD, y: PAD, w: 72, h: 72, name: "Número" },
    { id: "etq", type: "text", text: "{etiqueta}", font: "body", size: 28, weight: 700, color: "accent", align: "left", valign: "middle", lineHeight: 1, uppercase: true, letterSpacing: 2, x: PAD + 92, y: PAD, w: 600, h: 72 },
    { id: "pg", type: "text", text: "{index}/{total}", font: "body", size: 28, weight: 400, color: "muted", align: "right", valign: "middle", lineHeight: 1, x: w - PAD - 200, y: PAD, w: 200, h: 72 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 80, weight: 700, color: "fg", align: "left", valign: "bottom", lineHeight: 1.05, highlight: true, x: PAD, y: 360, w: inner, h: 300 },
    { id: "linha", type: "shape", shape: "rect", fill: "accent", radius: 4, x: PAD, y: 692, w: 96, h: 6, name: "Linha" },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 40, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 730, w: inner, h: 380 },
    ...footer(),
  ],
  last: [
    { id: "bg", type: "shape", shape: "rect", fill: "accent", x: 0, y: 0, w, h, locked: true, name: "Fundo" },
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "auto", color: "accent", size: 26, font: "body", x: PAD, y: PAD, w: 320, h: 52 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 96, weight: 700, color: "auto", align: "left", valign: "middle", lineHeight: 1.02, x: PAD, y: 380, w: inner, h: 420 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 40, weight: 400, color: "auto@0.8", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 830, w: inner, h: 200 },
    { id: "handle", type: "text", text: "{handle}", font: "body", size: 28, weight: 700, color: "auto@0.8", align: "left", valign: "bottom", lineHeight: 1, x: PAD, y: h - PAD - 40, w: 500, h: 40 },
    { id: "pages", type: "pagination", x: w - PAD - 300, y: h - PAD - 40, w: 300, h: 40, color: "auto@0.5", activeColor: "auto", arrow: false },
  ],
};

/** Insider: editorial, caixa alta, traço de destaque, número grande. */
export const INSIDER: LayerTemplate = {
  cover: [
    { id: "foto", type: "image", src: null, useCover: true, fit: "cover", fade: "bg", x: 0, y: 0, w, h: h * 0.7, name: "Capa do carrossel" },
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "accent", color: "auto", size: 26, font: "body", x: PAD, y: PAD, w: 300, h: 52 },
    { id: "num", type: "text", text: "{n}", font: "display", size: 40, weight: 400, color: "muted", align: "right", valign: "middle", lineHeight: 1, letterSpacing: 2, x: w - PAD - 200, y: PAD, w: 200, h: 52 },
    { id: "traco", type: "shape", shape: "rect", fill: "accent", x: PAD, y: h * 0.5, w: 120, h: 8, name: "Traço" },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 128, weight: 400, color: "fg", align: "left", valign: "top", lineHeight: 0.95, uppercase: true, x: PAD, y: h * 0.5 + 40, w: inner, h: 500 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.3, x: PAD, y: h - PAD - 200, w: inner, h: 120 },
    ...footer(),
  ],
  inner: [
    { id: "pill", type: "pill", text: "{n} / {total}", fill: "accent", color: "auto", size: 26, font: "body", x: PAD, y: PAD, w: 220, h: 52 },
    { id: "num", type: "text", text: "{n}", font: "display", size: 40, weight: 400, color: "muted", align: "right", valign: "middle", lineHeight: 1, letterSpacing: 2, x: w - PAD - 200, y: PAD, w: 200, h: 52 },
    { id: "traco", type: "shape", shape: "rect", fill: "accent", x: PAD, y: 440, w: 120, h: 8, name: "Traço" },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 100, weight: 400, color: "fg", align: "left", valign: "top", lineHeight: 0.95, uppercase: true, x: PAD, y: 480, w: inner, h: 320 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 820, w: inner, h: 300 },
    ...footer(),
  ],
  last: [
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "accent", color: "auto", size: 26, font: "body", x: PAD, y: PAD, w: 300, h: 52 },
    { id: "traco", type: "shape", shape: "rect", fill: "accent", x: PAD, y: 440, w: 120, h: 8, name: "Traço" },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 110, weight: 400, color: "fg", align: "left", valign: "top", lineHeight: 0.95, uppercase: true, x: PAD, y: 480, w: inner, h: 400 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 38, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 900, w: inner, h: 200 },
    ...footer(),
  ],
};

/** Full texto: texto gigante, número fantasma, pílula à direita. */
export const FULLTEXT: LayerTemplate = {
  cover: [
    { id: "num", type: "text", text: "{n}", font: "display", size: 64, weight: 400, color: "fg@0.35", align: "left", valign: "middle", lineHeight: 1, x: PAD, y: PAD, w: 200, h: 64 },
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "fg", color: "bg", size: 26, font: "body", x: w - PAD - 320, y: PAD, w: 320, h: 52 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 116, weight: 400, color: "fg", align: "left", valign: "middle", lineHeight: 1, x: PAD, y: 300, w: inner, h: 620 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 42, weight: 400, color: "fg@0.75", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 950, w: inner, h: 200 },
    ...footer(),
  ],
  inner: [
    { id: "num", type: "text", text: "{n}", font: "display", size: 64, weight: 400, color: "fg@0.35", align: "left", valign: "middle", lineHeight: 1, x: PAD, y: PAD, w: 200, h: 64 },
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "fg", color: "bg", size: 26, font: "body", x: w - PAD - 320, y: PAD, w: 320, h: 52 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 96, weight: 400, color: "fg", align: "left", valign: "middle", lineHeight: 1, x: PAD, y: 300, w: inner, h: 560 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 42, weight: 400, color: "fg@0.75", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 900, w: inner, h: 250 },
    ...footer(),
  ],
  last: [
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "fg", color: "bg", size: 26, font: "body", x: PAD, y: PAD, w: 320, h: 52 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 104, weight: 400, color: "fg", align: "left", valign: "middle", lineHeight: 1, x: PAD, y: 300, w: inner, h: 600 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 42, weight: 400, color: "fg@0.75", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 930, w: inner, h: 200 },
    ...footer(),
  ],
};

/** Notícias: tag urgente, manchete com palavras em bloco, barra vermelha. */
export const NEWS: LayerTemplate = {
  cover: [
    { id: "foto", type: "image", src: null, useCover: true, fit: "cover", fade: "bg", x: 0, y: 0, w, h, name: "Capa do carrossel" },
    { id: "pill", type: "pill", text: "{etiqueta}", fill: "accent", color: "auto", size: 30, font: "body", x: PAD, y: 640, w: 300, h: 60 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 112, weight: 400, color: "fg", align: "left", valign: "bottom", lineHeight: 1, uppercase: true, highlight: true, x: PAD, y: 710, w: inner, h: 390 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 40, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.3, x: PAD, y: h - PAD - 170, w: inner, h: 110 },
    ...footer(),
  ],
  inner: [
    { id: "barra", type: "shape", shape: "rect", fill: "accent", x: PAD, y: PAD, w: 16, h: 48, name: "Barra" },
    { id: "etq", type: "text", text: "{etiqueta}", font: "body", size: 30, weight: 700, color: "fg", align: "left", valign: "middle", lineHeight: 1, uppercase: true, letterSpacing: 3, x: PAD + 36, y: PAD, w: 600, h: 48 },
    { id: "pg", type: "text", text: "{index}/{total}", font: "body", size: 28, weight: 400, color: "muted", align: "right", valign: "middle", lineHeight: 1, x: w - PAD - 200, y: PAD, w: 200, h: 48 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 84, weight: 700, color: "fg", align: "left", valign: "bottom", lineHeight: 1, uppercase: true, highlight: true, x: PAD, y: 420, w: inner, h: 360 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 40, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 820, w: inner, h: 300 },
    ...footer(),
  ],
  last: [
    { id: "barra", type: "shape", shape: "rect", fill: "accent", x: PAD, y: PAD, w: 16, h: 48, name: "Barra" },
    { id: "etq", type: "text", text: "{etiqueta}", font: "body", size: 30, weight: 700, color: "fg", align: "left", valign: "middle", lineHeight: 1, uppercase: true, letterSpacing: 3, x: PAD + 36, y: PAD, w: 600, h: 48 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 96, weight: 700, color: "fg", align: "left", valign: "middle", lineHeight: 1, uppercase: true, x: PAD, y: 380, w: inner, h: 420 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 40, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 830, w: inner, h: 250 },
    ...footer(),
  ],
};


/** Desliza IA: foto em fade pro preto, número, manchete Sora com palavra em cor, seta pra deslizar. */
const dzFooter = (): Layer[] => [
  { id: "handle", type: "text", text: "{handle}", font: "body", size: 26, weight: 700, color: "muted@0.8", align: "left", valign: "bottom", lineHeight: 1, x: PAD, y: h - PAD - 44, w: 500, h: 44, name: "@" },
  { id: "seta-bg", type: "shape", shape: "circle", fill: "fg@0.12", strokeWidth: 3, stroke: "fg@0.5", x: w - PAD - 84, y: h - PAD - 84, w: 84, h: 84, name: "Seta (fundo)" },
  { id: "seta", type: "text", text: "→", font: "body", size: 44, weight: 700, color: "fg", align: "center", valign: "middle", lineHeight: 1, x: w - PAD - 84, y: h - PAD - 84, w: 84, h: 84, name: "Seta" },
];
const dzNumber = (size: number): Layer[] => [
  { id: "num", type: "text", text: "{n}", font: "display", size, weight: 700, color: "fg", align: "left", valign: "top", lineHeight: 1, x: PAD, y: PAD, w: 200, h: size + 10, name: "Número" },
];
export const DESLIZA: LayerTemplate = {
  cover: [
    { id: "bg", type: "shape", shape: "rect", fill: "linear-gradient(170deg, accent2@0.55 0%, bg 48%, bg 100%)", x: 0, y: 0, w, h, locked: true, name: "Fundo" },
    { id: "glow", type: "shape", shape: "circle", fill: "accent2@0.35", x: w - 520, y: -260, w: 760, h: 760, name: "Brilho violeta" },
    { id: "foto", type: "image", src: null, useCover: true, fit: "cover", fade: "bg", x: 0, y: 0, w, h: h * 0.78, name: "Capa do carrossel" },
    { id: "fade2", type: "shape", shape: "rect", fill: "linear-gradient(180deg, bg@0 0%, bg@0.85 55%, bg 100%)", x: 0, y: h * 0.4, w, h: h * 0.6, locked: true, name: "Fade inferior" },
    ...dzNumber(40),
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 92, weight: 700, color: "fg", align: "left", valign: "bottom", lineHeight: 1.05, highlight: true, highlightMode: "color", highlightColor: "accent", x: PAD, y: 560, w: inner, h: 480 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 34, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.3, x: PAD, y: 1064, w: inner - 120, h: 110 },
    ...dzFooter(),
  ],
  inner: [
    { id: "bg", type: "shape", shape: "rect", fill: "bg", x: 0, y: 0, w, h, locked: true, name: "Fundo" },
    { id: "glow", type: "shape", shape: "circle", fill: "accent2@0.22", x: -300, y: h - 500, w: 700, h: 700, name: "Brilho violeta" },
    { id: "foto", type: "image", src: null, useCover: true, fit: "cover", fade: "bg", opacity: 0.5, x: 0, y: 0, w, h: h * 0.6, name: "Capa do carrossel" },
    { id: "fade2", type: "shape", shape: "rect", fill: "linear-gradient(180deg, bg@0 0%, bg@0.9 60%, bg 100%)", x: 0, y: h * 0.25, w, h: h * 0.5, locked: true, name: "Fade inferior" },
    ...dzNumber(40),
    { id: "etq", type: "text", text: "{etiqueta}", font: "body", size: 26, weight: 700, color: "accent", align: "left", valign: "top", lineHeight: 1, uppercase: true, letterSpacing: 3, x: PAD, y: 600, w: inner, h: 36 },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 72, weight: 700, color: "fg", align: "left", valign: "top", lineHeight: 1.08, highlight: true, highlightMode: "color", highlightColor: "accent", x: PAD, y: 652, w: inner, h: 320 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 36, weight: 400, color: "muted", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 930, w: inner - 120, h: 230 },
    ...dzFooter(),
  ],
  last: [
    { id: "bg", type: "shape", shape: "rect", fill: "linear-gradient(160deg, accent2 0%, #4c1d95 45%, bg 100%)", x: 0, y: 0, w, h, locked: true, name: "Fundo" },
    { id: "glow", type: "shape", shape: "circle", fill: "#22d3ee@0.25", x: w - 560, y: h - 620, w: 820, h: 820, name: "Brilho ciano" },
    { id: "chev1", type: "text", text: "»", font: "display", size: 200, weight: 700, color: "accent", align: "left", valign: "top", lineHeight: 1, x: PAD - 10, y: 300, w: 300, h: 220, name: "Chevron" },
    { id: "titulo", type: "text", text: "{titulo}", font: "display", size: 84, weight: 700, color: "fg", align: "left", valign: "top", lineHeight: 1.05, highlight: true, highlightMode: "color", highlightColor: "accent", x: PAD, y: 540, w: inner, h: 380 },
    { id: "texto", type: "text", text: "{texto}", font: "body", size: 36, weight: 400, color: "fg@0.8", align: "left", valign: "top", lineHeight: 1.35, x: PAD, y: 940, w: inner - 120, h: 200 },
    { id: "risco", type: "shape", shape: "rect", fill: "accent", radius: 6, x: PAD, y: 1150, w: 220, h: 10, name: "Risco lima" },
    { id: "handle", type: "text", text: "{handle}", font: "body", size: 26, weight: 700, color: "fg@0.8", align: "left", valign: "bottom", lineHeight: 1, x: PAD, y: h - PAD - 44, w: 500, h: 44, name: "@" },
    { id: "pages", type: "pagination", x: w - PAD - 300, y: h - PAD - 40, w: 300, h: 40, color: "fg@0.4", activeColor: "accent", arrow: false },
  ],
};

export const PRESETS: { id: string; name: string; description: string; base: string; layers: LayerTemplate }[] = [
  { id: "clean", name: "Tela em branco", description: "Só título, texto e rodapé. Monte do zero.", base: "marketing", layers: CLEAN_SHEET },
  { id: "desliza", name: "Desliza IA", description: "Foto em fade pro preto, número, manchete com palavra em cor, seta.", base: "desliza", layers: DESLIZA },
  { id: "niche", name: "Nicho", description: "Pílula, título grande, número em bloco e CTA em destaque.", base: "marketing", layers: NICHE },
  { id: "insider", name: "Insider", description: "Editorial, caixa alta, traço de destaque.", base: "insider", layers: INSIDER },
  { id: "fulltext", name: "Full texto", description: "Texto gigante, sem imagem.", base: "full-texto", layers: FULLTEXT },
  { id: "news", name: "Notícias", description: "Tag urgente, manchete com blocos de cor, barra.", base: "noticias-virais", layers: NEWS },
];
