/* Monta N cards lado a lado num PNG pra conferir o fundo contínuo: npx tsx scripts/strip.ts dentistas 4x5 */
import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
const [id, aspect] = process.argv.slice(2);
const h = aspect === "1x1" ? 1080 : 1350, w = 1080, gap = 24, n = 4, scale = 0.35;
async function main() {
const imgs: string[] = [];
for (let i = 1; i <= n; i++) {
  const b = await readFile(`${process.env.DIR ?? "/tmp/seamless"}/${id}-${aspect}-${i}.png`);
  imgs.push(`<image x="${(i - 1) * (w + gap)}" y="0" width="${w}" height="${h}" href="data:image/png;base64,${b.toString("base64")}"/>`);
}
const W = n * w + (n - 1) * gap;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${h}"><rect width="${W}" height="${h}" fill="#fff"/>${imgs.join("")}</svg>`;
const png = new Resvg(svg, { fitTo: { mode: "width", value: Math.round(W * scale) } }).render().asPng();
await writeFile(`${process.env.DIR ?? "/tmp/seamless"}/strip-${id}-${aspect}.png`, png);
console.log("strip", id, aspect);
}
main();
