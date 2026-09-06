"use client";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { resolveStyle } from "@/lib/render/Slide";
import { getTemplate } from "@/lib/templates/registry";
import type { Profile, Template } from "@/lib/types";
import { SlidePreview } from "./SlidePreview";
import { Alert, Spinner } from "./ui";

type Suggestion = { templateId: string; topics: string[]; why: string };

export function Onboarding({ templates, profile }: { templates: Template[]; profile: Profile }) {
  const { t } = useI18n();
  const o = t.onboarding;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [nicheOther, setNicheOther] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("");
  const [handle, setHandle] = useState(profile.instagram_handle ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Suggestion | null>(null);

  const finalNiche = niche === "other" ? nicheOther.trim() : niche;
  const canNext = step === 0 ? !!finalNiche : step === 1 ? !!goal : !!tone;

  async function finish(skipped: boolean) {
    await fetch("/api/onboarding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ skipped }) });
    router.push("/app");
    router.refresh();
  }

  async function suggest() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ niche: finalNiche, goal, tone, handle }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? t.common.error);
    setResult(data);
    setStep(3);
  }

  async function create(topic: string) {
    await fetch("/api/onboarding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ skipped: false }) });
    const q = new URLSearchParams({ template: result!.templateId, topic, tone: toneToKey(tone), handle });
    router.push(`/app/novo?${q.toString()}`);
  }

  const steps = [
    { q: o.q1, options: o.niches, value: niche, set: setNiche, other: true },
    { q: o.q2, options: o.goals, value: goal, set: setGoal },
    { q: o.q3, options: o.tones, value: tone, set: setTone },
  ];
  const tpl = result ? getTemplate(result.templateId, templates) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={clsx("h-1.5 w-8 rounded-full", i <= step ? "bg-lime" : "bg-line")} />)}</div>
        <button onClick={() => finish(true)} className="text-sm text-fg-3 hover:text-fg">{o.skip}</button>
      </div>

      {step < 3 ? (
        <div className="fade-up mt-8" key={step}>
          <div className="text-xs font-bold uppercase tracking-wider text-lime">{o.kicker} · {step + 1}/3</div>
          <h1 className="mt-2 font-display text-3xl font-bold">{steps[step].q}</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {steps[step].options.map((opt) => (
              <button key={opt} onClick={() => steps[step].set(opt)} className={clsx("rounded-full border px-4 py-2.5 text-sm font-semibold transition", steps[step].value === opt ? "border-lime bg-lime text-black" : "border-line bg-bg-2 text-fg hover:border-fg-3")}>{opt}</button>
            ))}
            {steps[step].other ? (
              <button onClick={() => steps[step].set("other")} className={clsx("rounded-full border px-4 py-2.5 text-sm font-semibold transition", steps[step].value === "other" ? "border-lime bg-lime text-black" : "border-line bg-bg-2 text-fg hover:border-fg-3")}>{o.other}</button>
            ) : null}
          </div>
          {step === 0 && niche === "other" ? <input autoFocus className="input mt-4" placeholder={o.otherPlaceholder} value={nicheOther} onChange={(e) => setNicheOther(e.target.value)} /> : null}
          {step === 2 ? (
            <div className="mt-6">
              <label className="text-sm font-semibold text-fg-2">{o.handle}</label>
              <div className="mt-1 flex items-center gap-2"><span className="text-fg-3">@</span><input className="input" placeholder="seuperfil" value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} /></div>
              <p className="mt-1 text-xs text-fg-3">{o.handleHint}</p>
            </div>
          ) : null}
          {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
          <div className="mt-8 flex items-center gap-3">
            {step > 0 ? <button onClick={() => setStep(step - 1)} className="btn btn-ghost">{t.common.back}</button> : null}
            {step < 2 ? (
              <button disabled={!canNext} onClick={() => setStep(step + 1)} className="btn btn-primary">{o.next} →</button>
            ) : (
              <button disabled={!canNext || busy} onClick={suggest} className="btn btn-primary">{busy ? <><Spinner /> {o.thinking}</> : `${o.finish} →`}</button>
            )}
          </div>
        </div>
      ) : result && tpl ? (
        <div className="fade-up mt-8">
          <div className="text-xs font-bold uppercase tracking-wider text-lime">{o.resultKicker}</div>
          <h1 className="mt-2 font-display text-3xl font-bold">{o.resultTitle}</h1>
          <p className="mt-2 text-fg-2">{result.why}</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-[200px_1fr]">
            <div>
              <div className="overflow-hidden rounded-2xl border border-lime/60 shadow-lg shadow-lime/10">
                <SlidePreview template={tpl} slide={{ titulo: result.topics[0], etiqueta: tpl.name }} index={0} total={6} aspect="4:5" style={resolveStyle(tpl, { instagram_handle: handle || null })} authorName={profile.full_name} avatarUrl={profile.avatar_url} />
              </div>
              <div className="mt-2 text-center text-sm font-bold">{tpl.name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-fg-3">{o.topics}</div>
              {result.topics.map((topic) => (
                <button key={topic} onClick={() => create(topic)} className="card group flex w-full items-center justify-between gap-3 p-4 text-left transition hover:border-lime/60">
                  <span className="font-semibold">{topic}</span>
                  <span className="btn btn-primary btn-sm shrink-0">{o.createThis} →</span>
                </button>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={suggest} disabled={busy} className="btn btn-ghost btn-sm">{busy ? <Spinner /> : `↻ ${o.more}`}</button>
                <button onClick={() => finish(false)} className="btn btn-ghost btn-sm">{o.explore}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toneToKey(tone: string) {
  const s = tone.toLowerCase();
  if (s.includes("provoc")) return "provocador";
  if (s.includes("didát") || s.includes("didat") || s.includes("teach") || s.includes("educ")) return "didatico";
  if (s.includes("inspir")) return "inspirador";
  if (s.includes("jornal") || s.includes("journal")) return "jornalistico";
  return "direto";
}
