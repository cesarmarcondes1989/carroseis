import { z } from "zod";

/**
 * Template por camadas (o "Canva"): um template é composto de três pranchas,
 * capa, card do meio e CTA, cada uma com uma lista de camadas posicionadas em
 * coordenadas absolutas de 1080 x 1350 (o motor escala pra 1:1 quando preciso).
 *
 * Cores aceitam token da paleta (bg, fg, accent, muted, accent2) ou hex.
 * Textos aceitam vínculos com o conteúdo do card: {titulo} {texto} {etiqueta}
 * {handle} {index} {total} {n} (número com dois dígitos).
 */
export type ColorRef = "bg" | "fg" | "accent" | "muted" | "accent2" | (string & {});
export type Role = "cover" | "inner" | "last";

const base = {
  id: z.string().min(1).max(40),
  name: z.string().max(40).optional(),
  x: z.number().min(-2000).max(4000),
  y: z.number().min(-2000).max(4000),
  w: z.number().min(1).max(4000),
  h: z.number().min(1).max(4000),
  opacity: z.number().min(0).max(1).optional(),
  rotate: z.number().min(-360).max(360).optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
};

export const textLayerSchema = z.object({
  ...base,
  type: z.literal("text"),
  text: z.string().max(600),
  font: z.enum(["display", "body"]).default("display"),
  size: z.number().min(8).max(400),
  weight: z.union([z.literal(400), z.literal(700)]).default(700),
  color: z.string().max(40).default("fg"),
  align: z.enum(["left", "center", "right"]).default("left"),
  valign: z.enum(["top", "middle", "bottom"]).default("top"),
  lineHeight: z.number().min(0.7).max(2.5).default(1.05),
  uppercase: z.boolean().optional(),
  letterSpacing: z.number().min(-20).max(40).optional(),
  highlight: z.boolean().optional(),
  highlightColor: z.string().max(40).optional(),
});

export const shapeLayerSchema = z.object({
  ...base,
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle", "line"]).default("rect"),
  fill: z.string().max(200).default("accent"),
  radius: z.number().min(0).max(600).optional(),
  stroke: z.string().max(40).optional(),
  strokeWidth: z.number().min(0).max(60).optional(),
});

export const pillLayerSchema = z.object({
  ...base,
  type: z.literal("pill"),
  text: z.string().max(80).default("{etiqueta}"),
  fill: z.string().max(40).default("accent"),
  color: z.string().max(40).default("auto"),
  size: z.number().min(10).max(80).default(26),
  font: z.enum(["display", "body"]).default("body"),
});

export const imageLayerSchema = z.object({
  ...base,
  type: z.literal("image"),
  src: z.string().max(600).nullable().default(null),
  useCover: z.boolean().optional(),
  fit: z.enum(["cover", "contain"]).default("cover"),
  radius: z.number().min(0).max(600).optional(),
  fade: z.string().max(40).optional(),
});

export const paginationLayerSchema = z.object({
  ...base,
  type: z.literal("pagination"),
  color: z.string().max(40).default("muted"),
  activeColor: z.string().max(40).default("accent"),
  arrow: z.boolean().default(true),
});

export const layerSchema = z.discriminatedUnion("type", [textLayerSchema, shapeLayerSchema, pillLayerSchema, imageLayerSchema, paginationLayerSchema]);
export type Layer = z.infer<typeof layerSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;
export type ShapeLayer = z.infer<typeof shapeLayerSchema>;
export type PillLayer = z.infer<typeof pillLayerSchema>;
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type PaginationLayer = z.infer<typeof paginationLayerSchema>;

export const layerTemplateSchema = z.object({
  cover: z.array(layerSchema).max(40),
  inner: z.array(layerSchema).max(40),
  last: z.array(layerSchema).max(40),
});
export type LayerTemplate = z.infer<typeof layerTemplateSchema>;

export const CANVAS = { w: 1080, h: 1350 };
export const PAD = 80;

export function roleFor(index: number, total: number): Role {
  if (index === 0) return "cover";
  if (total > 1 && index === total - 1) return "last";
  return "inner";
}

export function newId(prefix = "l") {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

/** Vínculos: substitui {titulo} etc. Devolve null quando o texto é só um vínculo vazio (a camada some). */
export function bindText(text: string, ctx: { titulo?: string; texto?: string; etiqueta?: string; handle?: string | null; index: number; total: number }) {
  const map: Record<string, string> = {
    titulo: ctx.titulo ?? "",
    texto: ctx.texto ?? "",
    etiqueta: ctx.etiqueta ?? "",
    handle: ctx.handle ? `@${ctx.handle.replace(/^@/, "")}` : "",
    index: String(ctx.index + 1),
    total: String(ctx.total),
    n: String(ctx.index + 1).padStart(2, "0"),
  };
  const trimmed = text.trim();
  const only = /^\{(\w+)\}$/.exec(trimmed);
  if (only && !map[only[1]]) return null;
  return text.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? "");
}
