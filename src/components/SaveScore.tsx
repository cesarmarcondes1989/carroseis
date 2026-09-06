"use client";
import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { saveScore, scoreTone } from "@/lib/score";
import type { Slide } from "@/lib/types";

/** Score de Save: anel com o número e checklist do que falta pro roteiro ser salvo/enviado. */
export function SaveScore({ slides, compact = false }: { slides: Slide[]; compact?: boolean }) {
  const { t } = useI18n();
  const s = t.score;
  const [open, setOpen] = useState(!compact);
  const { score, checks } = useMemo(() => saveScore(slides), [slides]);
  const tone = scoreTone(score);
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "#f5c542" : "var(--danger)";
  const r = 22;
  const c = 2 * Math.PI * r;
  const visible = checks.filter((k) => k.weight > 0 || !k.ok);

  return (
    <div className="card p-4">
      <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(!open)}>
        <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 28 28)" />
          <text x="28" y="33" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--fg)">{score}</text>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{s.title}</div>
          <div className="text-sm text-fg-2">{tone === "ok" ? s.good : tone === "warn" ? s.mid : s.low}</div>
        </div>
        <span className="text-fg-3">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">
          {visible.map((k) => {
            const item = s.checks[k.id as keyof typeof s.checks];
            return (
              <li key={k.id} className={clsx("flex gap-2", k.ok ? "text-fg-2" : "text-fg")}>
                <span className={k.ok ? "text-ok" : "text-danger"}>{k.ok ? "✓" : "✕"}</span>
                <span><span className="font-semibold">{item.label}</span>{k.ok ? "" : <> · {item.tip.replace("{v}", k.value ?? "")}</>}</span>
              </li>
            );
          })}
          <li className="pt-1 text-[11px] text-fg-3">{s.why}</li>
        </ul>
      ) : null}
    </div>
  );
}
