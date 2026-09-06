"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { resolveStyle } from "@/lib/render/Slide";
import { SlidePreview } from "@/components/SlidePreview";
import type { Template } from "@/lib/types";

export function TemplatesList({ mine, presets }: { mine: Template[]; presets: { id: string; name: string; description: string; base: string }[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const sample = { titulo: "6 hábitos que comprometem seu **sorriso**", texto: "E você nem percebe.", etiqueta: "Dica" };

  async function del(tpl: Template) {
    if (!confirm(`${t.templatesPage.delete} "${tpl.name}"?`)) return;
    await fetch("/api/templates", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: tpl.user_template_id }) });
    router.refresh();
  }
  async function dup(tpl: Template) {
    const res = await fetch("/api/templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: `${tpl.name} (cópia)`, base_template_id: tpl.base_template_id, palette: tpl.palette, fonts: tpl.fonts, layers: tpl.layers, supports_ai_cover: tpl.supports_ai_cover }) });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{t.templatesPage.title}</h1>
      <p className="mt-1 text-fg-2">{t.templatesPage.subtitle}</p>

      <h2 className="mt-8 text-xs font-bold uppercase tracking-wider text-fg-3">{t.templatesPage.startFrom}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {presets.map((p) => (
          <Link key={p.id} href={`/app/templates/novo?preset=${p.id}`} className="card p-4 transition hover:border-lime/60">
            <div className="font-bold">{p.id === "clean" ? "＋ " : ""}{p.name}</div>
            <div className="mt-1 text-xs text-fg-2">{p.description}</div>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-wider text-fg-3">{t.templatesPage.mine}</h2>
      {mine.length === 0 ? <div className="card mt-3 p-8 text-center text-sm text-fg-2">{t.templatesPage.empty}</div> : (
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {mine.map((tpl) => (
            <div key={tpl.id} className="card overflow-hidden">
              <Link href={`/app/templates/${tpl.user_template_id}`}>
                <SlidePreview template={tpl} slide={sample} index={0} total={5} aspect="4:5" style={resolveStyle(tpl, { instagram_handle: "seuperfil" })} />
              </Link>
              <div className="p-3">
                <div className="truncate font-bold">{tpl.name}</div>
                <div className="mt-2 flex gap-1">
                  <Link href={`/app/templates/${tpl.user_template_id}`} className="btn btn-primary btn-sm flex-1">✎ {t.templatesPage.edit}</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => dup(tpl)} title={t.templatesPage.duplicate}>⧉</button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(tpl)} title={t.templatesPage.delete}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
