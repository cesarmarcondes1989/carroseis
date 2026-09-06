import { notFound } from "next/navigation";
import { Studio } from "@/components/Studio";
import { listBrandModels, listTemplates } from "@/lib/carousel-service";
import { planActive } from "@/lib/credits";
import { getSession } from "@/lib/supabase/server";
import type { Carousel } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await getSession();
  const [{ data }, templates, models] = await Promise.all([supabase.from("carousels").select("*").eq("id", id).maybeSingle(), listTemplates(), listBrandModels(profile!.id)]);
  if (!data) notFound();
  return <Studio initial={data as Carousel} templates={templates} models={models} profile={profile!} canDownload={planActive(profile!)} />;
}
