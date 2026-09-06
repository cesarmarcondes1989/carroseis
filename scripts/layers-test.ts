/* Renderiza os presets do editor pelo Satori: npx tsx scripts/layers-test.ts */
import { writeFile, mkdir } from "node:fs/promises";
import { TEMPLATES, getTemplate } from "../src/lib/templates/registry";
import { PRESETS } from "../src/lib/layers/presets";
import { resolveStyle } from "../src/lib/render/Slide";
import { renderAll } from "../src/lib/render/render";
import type { Template } from "../src/lib/types";
const slides = [
  { titulo: "6 hábitos que comprometem seu **sorriso**", texto: "E você nem percebe.", etiqueta: "Dentistas" },
  { titulo: "Escovar com força", texto: "Pressão demais desgasta o esmalte e machuca a gengiva." },
  { titulo: "Dormir sem escovar", texto: "A placa trabalha a noite inteira." },
  { titulo: "Salva esse post", texto: "E marca alguém.", etiqueta: "CTA" },
];
async function main() {
  await mkdir("/tmp/layers", { recursive: true });
  for (const p of PRESETS) {
    const base = getTemplate(p.base, TEMPLATES);
    const template: Template = { ...base, id: `user:${p.id}`, name: p.name, layers: p.layers, custom: true };
    const style = resolveStyle(template, { instagram_handle: "bhava.odontologia" });
    const t0 = Date.now();
    for (const aspect of ["4:5", "1:1"] as const) {
      const pngs = await renderAll({ template, style, slides, aspect, title: slides[0].titulo });
      for (let i = 0; i < pngs.length; i++) await writeFile(`/tmp/layers/${p.id}-${aspect.replace(":", "x")}-${i + 1}.png`, pngs[i]);
    }
    console.log("OK", p.id, Date.now() - t0, "ms");
  }
}
main().catch((e) => { console.error("FAIL", e); process.exit(1); });
