import { BrandModels } from "@/components/BrandModels";
import { listBrandModels } from "@/lib/carousel-service";
import { listTemplatesFor } from "@/lib/templates/custom";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Modelos() {
  const { profile } = await getSession();
  const [models, templates] = await Promise.all([listBrandModels(profile!.id), listTemplatesFor(profile!.id)]);
  return <BrandModels models={models} templates={templates} />;
}
