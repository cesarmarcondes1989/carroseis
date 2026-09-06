"use client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { resolveStyle } from "@/lib/render/Slide";
import { sampleSlides } from "@/lib/samples";
import { getTemplate } from "@/lib/templates/registry";
import type { BrandModel, Template } from "@/lib/types";
import { SlidePreview } from "./SlidePreview";

export function BrandModels({ models, templates }: { models: BrandModel[]; templates: Template[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  async function act(method: "PATCH" | "DELETE", id: string) {
    if (method === "DELETE" && !confirm(`${t.models.delete}?`)) return;
    await fetch("/api/brand-models", { method, headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{t.models.title}</h1>
      <p className="mt-1 text-fg-2">{t.models.subtitle}</p>
      {models.length === 0 ? (
        <div className="card mt-8 p-10 text-center text-fg-2">{t.models.empty}</div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {models.map((m) => {
            const tpl = getTemplate(m.template_id ?? "marketing", templates);
            const style = resolveStyle(tpl, { palette: m.palette ?? undefined, font_display: m.font_display, font_body: m.font_body, text_scale: Number(m.text_scale), instagram_handle: m.instagram_handle });
            return (
              <div key={m.id} className="card overflow-hidden">
                <SlidePreview template={tpl} slide={sampleSlides(tpl, locale)[0]} index={0} total={5} aspect="4:5" style={style} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{m.name}</span>
                    {m.is_default ? <span className="pill bg-lime text-black">★ {t.models.default}</span> : null}
                  </div>
                  <div className="mt-1 text-xs text-fg-3">{tpl.name} · {style.fontDisplay} · {Math.round(style.scale * 100)}%{m.instagram_handle ? ` · @${m.instagram_handle}` : ""}</div>
                  <div className="mt-3 flex gap-2">
                    {!m.is_default ? <button className="btn btn-ghost btn-sm flex-1" onClick={() => act("PATCH", m.id)}>{t.models.makeDefault}</button> : null}
                    <button className="btn btn-danger btn-sm" onClick={() => act("DELETE", m.id)}>{t.models.delete}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
