import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, dictionaries, type Locale } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("locale")?.value;
  if (c && LOCALES.includes(c as Locale)) return c as Locale;
  const accept = (await headers()).get("accept-language") ?? "";
  if (/^en/i.test(accept.split(",")[0] ?? "")) return "en";
  return DEFAULT_LOCALE;
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
