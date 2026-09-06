import { notFound, redirect } from "next/navigation";
import { TemplateEditor, type EditorDoc } from "@/components/templates/TemplateEditor";
import { PRESETS } from "@/lib/layers/presets";
import { canEditTemplates, listTemplates, listUserTemplates } from "@/lib/templates/custom";
import { getTemplate } from "@/lib/templates/registry";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preset?: string; from?: string }> }) {
  const { id } = await params;
  const { preset, from } = await searchParams;
  const { profile } = await getSession();
  if (!canEditTemplates(profile!)) redirect("/app/templates");
  const catalog = await listTemplates();

  if (id === "novo") {
    // "from" = template do catálogo cuja paleta/fontes servem de base; "preset" = ponto de partida das camadas
    const base = getTemplate(from ?? "marketing", catalog);
    const p = PRESETS.find((x) => x.id === preset) ?? PRESETS.find((x) => x.base === base.id && x.id !== "clean") ?? PRESETS.find((x) => x.id === (base.layout === "insider" ? "insider" : base.layout === "fulltext" ? "fulltext" : base.layout === "news" ? "news" : "niche"))!;
    const initial: EditorDoc = { id: null, name: from ? `${base.name} (meu)` : p.name, base: base.id, palette: base.palette, fonts: base.fonts, layers: p.layers, supportsAiCover: base.supports_ai_cover };
    return <TemplateEditor initial={initial} baseTemplate={base} />;
  }

  const row = (await listUserTemplates(profile!.id)).find((r) => r.id === id);
  if (!row) notFound();
  const base = getTemplate(row.base_template_id, catalog);
  const initial: EditorDoc = { id: row.id, name: row.name, base: row.base_template_id, palette: row.palette, fonts: row.fonts, layers: row.layers, supportsAiCover: row.supports_ai_cover };
  return <TemplateEditor initial={initial} baseTemplate={base} />;
}
