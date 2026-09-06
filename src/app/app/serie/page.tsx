import { SeriesCreator } from "@/components/SeriesCreator";
import { listBrandModels } from "@/lib/carousel-service";
import { listTemplatesFor } from "@/lib/templates/custom";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Serie({ searchParams }: { searchParams: Promise<{ template?: string; topic?: string }> }) {
  const { profile } = await getSession();
  const [templates, models] = await Promise.all([listTemplatesFor(profile!.id), listBrandModels(profile!.id)]);
  const { template, topic } = await searchParams;
  return <SeriesCreator templates={templates} models={models} profile={profile!} initialTemplate={template} initialTopic={topic} />;
}
