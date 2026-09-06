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

export const PRESETS: { id: string; name: string; description: string; base: string; layers: LayerTemplate }[] = [
  { id: "clean", name: "Tela em branco", description: "Só título, texto e rodapé. Monte do zero.", base: "marketing", layers: CLEAN_SHEET },
  { id: "niche", name: "Nicho", description: "Pílula, título grande, número em bloco e CTA em destaque.", base: "marketing", layers: NICHE },
  { id: "insider", name: "Insider", description: "Editorial, caixa alta, traço de destaque.", base: "insider", layers: INSIDER },
  { id: "fulltext", name: "Full texto", description: "Texto gigante, sem imagem.", base: "full-texto", layers: FULLTEXT },
  { id: "news", name: "Notícias", description: "Tag urgente, manchete com blocos de cor, barra.", base: "noticias-virais", layers: NEWS },
];
