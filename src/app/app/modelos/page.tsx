import { BrandModels } from "@/components/BrandModels";
import { listBrandModels, listTemplates } from "@/lib/carousel-service";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Modelos() {
  const { profile } = await getSession();
  const [models, templates] = await Promise.all([listBrandModels(profile!.id), listTemplates()]);
  return <BrandModels models={models} templates={templates} />;
}
