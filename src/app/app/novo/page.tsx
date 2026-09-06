import { Creator } from "@/components/Creator";
import { listBrandModels, listTemplates } from "@/lib/carousel-service";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Novo({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { profile } = await getSession();
  const [templates, models] = await Promise.all([listTemplates(), listBrandModels(profile!.id)]);
  const { template } = await searchParams;
  return <Creator templates={templates} models={models} profile={profile!} initialTemplate={template} />;
}
