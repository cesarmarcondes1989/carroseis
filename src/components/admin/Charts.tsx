"use client";
import { useMemo, useState } from "react";

/* Paleta categórica validada para superfície escura (dataviz skill, modo dark). */
export const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500"] as const;
const SURFACE = "#0e0e13";
const GRID = "#24242c";
const TEXT_2 = "#a1a1aa";
const TEXT_3 = "#63636e";

export type Series = { name: string; values: number[]; color?: string };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

const fmtNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n)));

/** Linhas de 2px, marcador ≥8px com anel de superfície, crosshair + tooltip. Um eixo só. */
const FORMATTERS: Record<"number" | "currency", (n: number) => string> = {
  number: fmtNum,
  currency: (n) => `R$${n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0)}`,
};

export function LineChart({ labels, series, height = 200, format = "number", title }: { labels: string[]; series: Series[]; height?: number; format?: "number" | "currency"; title?: string }) {
  const fmt = FORMATTERS[format];
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, padL = 44, padR = 12, padT = 12, padB = 26;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const paths = useMemo(() => series.map((s) => s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")), [series, n, max]); // eslint-disable-line react-hooks/exhaustive-deps
  const labelEvery = Math.max(1, Math.ceil(n / 6));

  return (
    <div className="w-full">
      {title ? <div className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-3">{title}</div> : null}
      {series.length > 1 ? (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-fg-2">
          {series.map((s, i) => (
            <span key={s.name} className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color ?? SERIES[i] }} />{s.name}</span>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            const i = Math.round(((px - padL) / (W - padL - padR)) * (n - 1));
            setHover(Math.max(0, Math.min(n - 1, i)));
          }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill={TEXT_3}>{fmt(t)}</text>
            </g>
          ))}
          {labels.map((l, i) => (i % labelEvery === 0 || i === n - 1 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill={TEXT_3}>{l}</text> : null))}
          {series.map((s, si) => (
            <g key={s.name}>
              <path d={paths[si]} fill="none" stroke={s.color ?? SERIES[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {n > 0 ? <circle cx={x(n - 1)} cy={y(s.values[n - 1] ?? 0)} r={4} fill={s.color ?? SERIES[si]} stroke={SURFACE} strokeWidth={2} /> : null}
            </g>
          ))}
          {hover !== null ? (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke={TEXT_3} strokeWidth={1} />
              {series.map((s, si) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={5} fill={s.color ?? SERIES[si]} stroke={SURFACE} strokeWidth={2} />)}
            </g>
          ) : null}
        </svg>
        {hover !== null ? (
          <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-bg px-3 py-2 text-xs shadow-xl" style={{ left: `${Math.min(80, Math.max(0, (x(hover) / W) * 100))}%` }}>
            <div className="font-bold text-fg">{labels[hover]}</div>
            {series.map((s, si) => (
              <div key={s.name} className="flex items-center gap-2 text-fg-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color ?? SERIES[si] }} />{s.name}: <b className="text-fg">{fmt(s.values[hover] ?? 0)}</b></div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Barras horizontais ≤ 24px, ponta arredondada 4px, valor na ponta. Uma série. */
export function Bars({ items, color = SERIES[0], format = fmtNum, title, max: maxIn }: { items: { label: string; value: number }[]; color?: string; format?: (n: number) => string; title?: string; max?: number }) {
  const max = maxIn ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      {title ? <div className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-3">{title}</div> : null}
      <div className="space-y-2">
        {items.length === 0 ? <div className="text-xs text-fg-3">Sem dados ainda.</div> : null}
        {items.map((it) => (
          <div key={it.label} className="group flex items-center gap-3 text-xs" title={`${it.label}: ${format(it.value)}`}>
            <div className="w-32 shrink-0 truncate text-fg-2">{it.label}</div>
            <div className="relative h-4 flex-1">
              <div className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${Math.max(1, (it.value / max) * 100)}%`, background: color, borderRadius: "0 4px 4px 0" }} />
            </div>
            <div className="w-12 text-right font-semibold text-fg">{format(it.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ values, color = SERIES[0], width = 96, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const n = values.length;
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / Math.max(1, n - 1)) * (width - 4) + 2).toFixed(1)},${(height - 3 - (v / max) * (height - 6)).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={d} fill="none" stroke={TEXT_2} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.6} />
      {n ? <circle cx={((n - 1) / Math.max(1, n - 1)) * (width - 4) + 2} cy={height - 3 - ((values[n - 1] ?? 0) / max) * (height - 6)} r={3} fill={color} stroke={SURFACE} strokeWidth={1.5} /> : null}
    </svg>
  );
}

export function Kpi({ label, value, delta, deltaLabel, trend, color, hint }: { label: string; value: string; delta?: number | null; deltaLabel?: string; trend?: number[]; color?: string; hint?: string }) {
  const up = (delta ?? 0) > 0, down = (delta ?? 0) < 0;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{label}</div>
        {trend ? <Sparkline values={trend} color={color} /> : null}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</div>
      {delta !== undefined && delta !== null ? (
        <div className={`mt-1 text-xs ${up ? "text-ok" : down ? "text-danger" : "text-fg-3"}`}>{up ? "▲" : down ? "▼" : "•"} {Math.abs(delta).toFixed(0)}% {deltaLabel}</div>
      ) : hint ? <div className="mt-1 text-xs text-fg-3">{hint}</div> : null}
    </div>
  );
}

export { pct } from "@/lib/pct";
