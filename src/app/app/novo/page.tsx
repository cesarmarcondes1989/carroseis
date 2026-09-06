import { Creator } from "@/components/Creator";
import { listBrandModels } from "@/lib/carousel-service";
import { canEditTemplates, listTemplatesFor } from "@/lib/templates/custom";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Novo({ searchParams }: { searchParams: Promise<{ template?: string; topic?: string; tone?: string; handle?: string }> }) {
  const { profile } = await getSession();
  const [templates, models] = await Promise.all([listTemplatesFor(profile!.id), listBrandModels(profile!.id)]);
  const { template, topic, tone, handle } = await searchParams;
  return <Creator templates={templates} models={models} profile={profile!} initialTemplate={template} initialTopic={topic} initialTone={tone} initialHandle={handle} canEditTemplates={canEditTemplates(profile!)} />;
}
