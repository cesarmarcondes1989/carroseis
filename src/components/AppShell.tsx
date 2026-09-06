"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import type { Profile } from "@/lib/types";
import { LocaleSwitch, Logo } from "./ui";

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { t } = useI18n();
  const path = usePathname();
  const items = [
    { href: "/app", label: t.app.projects, icon: "▦" },
    { href: "/app/novo", label: t.app.newCarousel, icon: "＋" },
    { href: "/app/modelos", label: t.app.models, icon: "◐" },
    { href: "/app/creditos", label: t.app.credits, icon: "◈" },
    { href: "/app/templates", label: t.app.templates, icon: "✎" },
    { href: "/app/chave-api", label: t.app.apiKeys, icon: "⌘" },
    { href: "/app/conta", label: t.app.account, icon: "●" },
    ...(profile.role === "admin" ? [{ href: "/admin", label: t.app.admin, icon: "★" }] : []),
  ];
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line/60 bg-bg-2 p-5 md:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {items.map((i) => {
            const active = i.href === "/app" ? path === "/app" : path.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-bg-3 text-fg" : "text-fg-2 hover:bg-bg-3/60 hover:text-fg")}>
                <span className="w-5 text-center text-lime">{i.icon}</span>
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{t.app.balance}</div>
            <div className="font-display text-2xl font-bold">{profile.unlimited_credits ? "∞" : profile.credits}</div>
            <div className="text-xs text-fg-2">{profile.unlimited_credits ? t.app.unlimited : `${t.app.plan}: ${profile.plan}`}</div>
            <Link href="/app/creditos" className="btn btn-primary btn-sm mt-3 w-full">{t.creditsPage.buy}</Link>
          </div>
          <div className="flex items-center justify-between">
            <LocaleSwitch />
            <form action="/auth/signout" method="post">
              <button className="text-xs text-fg-3 hover:text-fg">{t.app.logout}</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line/60 px-5 py-3 md:hidden">
          <Logo />
          <div className="flex items-center gap-2 text-sm">
            <span className="pill bg-bg-3 text-lime">{profile.unlimited_credits ? "∞" : profile.credits}</span>
            <LocaleSwitch />
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-line/60 px-3 py-2 text-xs font-semibold md:hidden scrollbar-thin">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={clsx("whitespace-nowrap rounded-lg px-3 py-1.5", path === i.href ? "bg-bg-3 text-fg" : "text-fg-2")}>
              {i.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
