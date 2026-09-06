import Link from "next/link";
import { getDict } from "@/lib/i18n/server";
import { getSession } from "@/lib/supabase/server";
import { LocaleSwitch, Logo } from "./ui";

export async function Nav() {
  const { t } = await getDict();
  const { user } = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-fg-2 md:flex">
          <Link href="/#templates" className="hover:text-fg">{t.nav.templates}</Link>
          <Link href="/precos" className="hover:text-fg">{t.nav.pricing}</Link>
          <Link href="/#mcp" className="hover:text-fg">{t.nav.mcp}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitch />
          {user ? (
            <Link href="/app" className="btn btn-primary btn-sm">{t.nav.app}</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">{t.nav.login}</Link>
              <Link href="/cadastro" className="btn btn-primary btn-sm">{t.nav.signup}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export async function Footer() {
  const { t } = await getDict();
  return (
    <footer className="border-t border-line/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-fg-3 md:flex-row">
        <Logo className="text-base" />
        <p>{t.footer.tagline}</p>
        <div className="flex gap-5">
          <Link href="/precos" className="hover:text-fg">{t.nav.pricing}</Link>
          <Link href="/#mcp" className="hover:text-fg">MCP</Link>
        </div>
      </div>
    </footer>
  );
}
