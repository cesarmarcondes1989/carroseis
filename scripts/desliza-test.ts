/* Renderiza o template Desliza IA pelo Satori: npx tsx scripts/desliza-test.ts */
import { writeFile, mkdir } from "node:fs/promises";
import { TEMPLATES, getTemplate } from "../src/lib/templates/registry";
import { resolveStyle } from "../src/lib/render/Slide";
import { renderAll } from "../src/lib/render/render";
const slides = [
  { titulo: "O que aconteceria se a **Terra** parasse de girar?", texto: "Os efeitos seriam mais insanos do que você imagina.", etiqueta: "Curiosidades" },
  { titulo: "Tudo continuaria em **movimento**", texto: "A atmosfera e os oceanos seguiriam a 1.600 km/h. Ventos além de qualquer furacão.", etiqueta: "Física" },
  { titulo: "Um dia duraria **um ano**", texto: "Seis meses de sol, seis meses de noite. Extremos de calor e frio em cada hemisfério.", etiqueta: "Consequência" },
  { titulo: "Salva esse post e **desliza** pro próximo", texto: "Toda semana uma ideia que faz você parar de deslizar.", etiqueta: "Desliza IA" },
];
const cover = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><radialGradient id="p" cx="0.55" cy="0.35" r="0.5"><stop offset="0" stop-color="#2563eb"/><stop offset="0.6" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/></radialGradient></defs><rect width="1080" height="1350" fill="#020617"/><circle cx="600" cy="470" r="330" fill="url(#p)"/><circle cx="600" cy="470" r="330" fill="none" stroke="#7c3aed" stroke-width="6" opacity="0.6"/><g fill="#e2e8f0" opacity="0.8"><circle cx="120" cy="140" r="3"/><circle cx="900" cy="90" r="2"/><circle cx="980" cy="700" r="3"/><circle cx="200" cy="900" r="2"/><circle cx="820" cy="1000" r="2.5"/></g></svg>')}`;
async function main() {
  const out = process.env.OUT ?? "/tmp/desliza";
  await mkdir(out, { recursive: true });
  const template = getTemplate("desliza", TEMPLATES);
  const style = resolveStyle(template, { instagram_handle: "deslizaia" });
  for (const aspect of ["4:5", "1:1"] as const) {
    const pngs = await renderAll({ template, style, slides, aspect, title: slides[0].titulo, coverImage: cover });
    for (let i = 0; i < pngs.length; i++) await writeFile(`${out}/desliza-${aspect.replace(":", "x")}-${i + 1}.png`, pngs[i]);
    console.log("OK", aspect);
  }
}
main().catch((e) => { console.error("FAIL", e); process.exit(1); });
