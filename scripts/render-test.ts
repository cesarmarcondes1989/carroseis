/* Teste local do renderizador: npx tsx scripts/render-test.ts */
import { writeFile, mkdir } from "node:fs/promises";
import { TEMPLATES } from "../src/lib/templates/registry";
import { resolveStyle } from "../src/lib/render/Slide";
import { renderAll } from "../src/lib/render/render";

const slides = [
  { titulo: "5 erros que fazem seu **anúncio** queimar dinheiro", texto: "E como consertar cada um deles hoje.", etiqueta: "Tráfego pago" },
  { titulo: "Público frio com oferta quente", texto: "Você pede casamento no primeiro encontro. Aqueça antes: conteúdo, prova social, depois oferta." },
  { titulo: "Salva esse post e me segue", texto: "Toda semana tem mais.", etiqueta: "CTA" },
];

async function main() {
  await mkdir("/tmp/render-test", { recursive: true });
  for (const id of process.argv.slice(2).length ? process.argv.slice(2) : ["marketing", "noticias-virais", "insider", "full-texto", "post-social", "essencial"]) {
    const template = TEMPLATES.find((t) => t.id === id)!;
    const style = resolveStyle(template, { instagram_handle: "cesarmarcondes" });
    const t0 = Date.now();
    const pngs = await renderAll({ template, style, slides, aspect: "4:5", authorName: "Cesar Marcondes" });
    for (let i = 0; i < pngs.length; i++) await writeFile(`/tmp/render-test/${id}-${i + 1}.png`, pngs[i]);
    console.log(id, `${pngs.length} slides em ${Date.now() - t0}ms`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
