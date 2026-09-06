"use client";
import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { setLocaleCookie, useI18n } from "@/lib/i18n/client";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={clsx("inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight", className)} aria-label="Desliza IA">
      <BrandMark size={28} />
      {compact ? null : <span className="whitespace-nowrap">desliza <span className="text-gradient">IA</span></span>}
    </Link>
  );
}

/** Chevron duplo com o gradiente da marca (violeta → ciano → lima). */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="dz-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a3e635" />
        </linearGradient>
      </defs>
      <path d="M8 12l12 12-12 12" stroke="url(#dz-g)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 8l16 16-16 16" stroke="url(#dz-g)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
