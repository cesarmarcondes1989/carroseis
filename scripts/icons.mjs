/* Gera os ícones PWA/Apple a partir do chevron da marca: node scripts/icons.mjs */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="12" y1="32" x2="52" y2="32" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#7c3aed"/><stop offset="0.5" stop-color="#22d3ee"/><stop offset="1" stop-color="#a3e635"/></linearGradient></defs>
  <rect width="64" height="64" rx="${pad ? 0 : 16}" fill="#0b0b0f"/>
  <path d="M15 20l12 12-12 12" fill="none" stroke="url(#g)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M31 16l16 16-16 16" fill="none" stroke="url(#g)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const out = (file, size, square) => {
  const png = new Resvg(svg(square), { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(file, png);
  console.log(file, png.length);
};
// iOS arredonda sozinho: ícone quadrado, sem cantos transparentes
out("src/app/apple-icon.png", 180, true);
out("public/icons/icon-192.png", 192, true);
out("public/icons/icon-512.png", 512, true);
out("public/icons/icon-maskable-512.png", 512, true);
