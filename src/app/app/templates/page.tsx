import Link from "next/link";
import { TemplatesList } from "@/components/templates/TemplatesList";
import { PRESETS } from "@/lib/layers/presets";
import { getDict } from "@/lib/i18n/server";
import { canEditTemplates, listUserTemplates, rowToTemplate } from "@/lib/templates/custom";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Templates() {
  const { t } = await getDict();
  const { profile } = await getSession();
  const canEdit = canEditTemplates(profile!);
  const mine = (await listUserTemplates(profile!.id)).map(rowToTemplate);
  if (!canEdit) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold">{t.templatesPage.title}</h1>
        <div className="card glow mt-6 p-8">
          <span className="pill border border-lime/40 bg-lime/10 text-lime">Agência</span>
          <h2 className="mt-3 font-display text-2xl font-bold">{t.templatesPage.locked}</h2>
          <p className="mt-2 text-fg-2">{t.templatesPage.lockedDesc}</p>
          <Link href="/app/creditos?plano=agency" className="btn btn-primary mt-6">{t.templatesPage.upgrade} →</Link>
        </div>
        {mine.length ? <p className="mt-4 text-sm text-fg-3">{mine.length} template(s) seus continuam disponíveis no criador e no estúdio.</p> : null}
      </div>
    );
  }
  return <TemplatesList mine={mine} presets={PRESETS.map((p) => ({ id: p.id, name: p.name, description: p.description, base: p.base }))} />;
}
