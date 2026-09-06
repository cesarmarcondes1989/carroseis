"use client";
import { createContext, useContext } from "react";
import { dictionaries, type Dictionary, type Locale } from "./dictionaries";

const Ctx = createContext<{ locale: Locale; t: Dictionary }>({ locale: "pt-BR", t: dictionaries["pt-BR"] });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t: dictionaries[locale] }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}

export function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}
