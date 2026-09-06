"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { setLocaleCookie, useI18n } from "@/lib/i18n/client";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime text-black">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <rect x="3" y="5" width="12" height="14" rx="2" />
          <path d="M18 8v8" />
          <path d="M21 10v4" />
        </svg>
      </span>
      Carrosseis<span className="text-lime">IA</span>
    </Link>
  );
}

export function LocaleSwitch() {
  const { locale } = useI18n();
  return (
    <button onClick={() => setLocaleCookie(locale === "en" ? "pt-BR" : "en")} className="pill border border-line text-fg-2 hover:text-fg" title="Idioma / Language">
      {locale === "en" ? "EN" : "PT"}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={clsx("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? t.common.copied : label ?? t.common.copy}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-fg-2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-fg-3">{hint}</span> : null}
    </label>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "ok" | "info"; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-xl border px-4 py-3 text-sm", kind === "error" && "border-danger/40 bg-danger/10 text-danger", kind === "ok" && "border-ok/40 bg-ok/10 text-ok", kind === "info" && "border-violet/40 bg-violet/10 text-fg")}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-fg-2">{sub}</div> : null}
    </div>
  );
}

export { formatBRL } from "@/lib/format";
