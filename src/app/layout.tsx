import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Desliza IA · Ideias que fazem você parar de deslizar", template: "%s · Desliza IA" },
  description: "Carrosséis para Instagram com IA. Escolha o template, diga o tema: a IA escreve o roteiro, desenha a arte e entrega as imagens prontas pra postar. 30 créditos grátis.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: { title: "Desliza IA", description: "Ideias que fazem você parar de deslizar. Carrosséis para Instagram em menos de 1 minuto, com IA.", type: "website", locale: "pt_BR" },
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
