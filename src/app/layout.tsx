import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "CarrosseisIA · Gerador de carrossel para Instagram com IA", template: "%s · CarrosseisIA" },
  description: "Escolha o template, diga o tema. A IA escreve o roteiro, desenha a arte e entrega os PNGs prontos pra postar. 30 créditos grátis.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: { title: "CarrosseisIA", description: "Carrosséis para Instagram em menos de 1 minuto, com IA.", type: "website", locale: "pt_BR" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "en" ? "en" : "pt-BR"}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
