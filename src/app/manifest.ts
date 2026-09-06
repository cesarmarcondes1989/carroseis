import type { MetadataRoute } from "next";

/** PWA: permite "Adicionar à tela inicial" com o ícone e o nome do Desliza IA. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Desliza IA",
    short_name: "Desliza IA",
    description: "Ideias que fazem você parar de deslizar. Carrosséis para Instagram com IA.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
