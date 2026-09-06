import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Font } from "satori";
import { FONT_FILES } from "@/lib/templates/registry";

const cache = new Map<string, Promise<Buffer>>();

function load(file: string) {
  let p = cache.get(file);
  if (!p) {
    p = readFile(path.join(process.cwd(), "public", "fonts", file));
    cache.set(file, p);
  }
  return p;
}

/** Carrega as fontes necessárias (regular 400 + bold 700) para o Satori. */
export async function loadFonts(families: string[]): Promise<Font[]> {
  const set = new Set([...families, "Inter"]);
  const fonts: Font[] = [];
  for (const family of set) {
    const files = FONT_FILES[family];
    if (!files) continue;
    const [regular, bold] = await Promise.all([load(files.regular), load(files.bold)]);
    fonts.push({ name: family, data: regular, weight: 400, style: "normal" });
    fonts.push({ name: family, data: bold, weight: 700, style: "normal" });
  }
  return fonts;
}
