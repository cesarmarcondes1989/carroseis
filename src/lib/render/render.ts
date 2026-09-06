import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { createElement } from "react";
import { SIZES, type Aspect, type Slide, type Template } from "@/lib/types";
import { SlideView, type ResolvedStyle } from "./Slide";
import { loadFonts } from "./fonts";

export type RenderInput = {
  template: Template;
  style: ResolvedStyle;
  slides: Slide[];
  aspect: Aspect;
  coverImage?: string | null; // data URL ou URL pública
  authorName?: string | null;
  avatarUrl?: string | null;
  seamless?: boolean;
  title?: string | null;
};

export async function renderSlidePng(input: RenderInput, index: number): Promise<Buffer> {
  const { w, h } = SIZES[input.aspect];
  const fonts = await loadFonts([input.style.fontDisplay, input.style.fontBody]);
  const element = createElement(SlideView, {
    template: input.template,
    slide: input.slides[index],
    index,
    total: input.slides.length,
    aspect: input.aspect,
    style: input.style,
    coverImage: index === 0 || input.seamless ? input.coverImage : null,
    authorName: input.authorName,
    avatarUrl: input.avatarUrl,
    seamless: input.seamless,
    carouselTitle: input.title,
  });
  const svg = await satori(element, { width: w, height: h, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: w }, font: { loadSystemFonts: false } }).render().asPng();
  return Buffer.from(png);
}

export async function renderAll(input: RenderInput): Promise<Buffer[]> {
  const out: Buffer[] = [];
  for (let i = 0; i < input.slides.length; i++) out.push(await renderSlidePng(input, i));
  return out;
}

/** Baixa uma imagem e devolve data URL (Satori fica mais estável assim que com URL remota). */
export async function toDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) return null;
  const type = res.headers.get("content-type") ?? "image/png";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString("base64")}`;
}
