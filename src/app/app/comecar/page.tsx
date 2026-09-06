import { Onboarding } from "@/components/Onboarding";
import { listTemplates } from "@/lib/carousel-service";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Comecar() {
  const { profile } = await getSession();
  const templates = await listTemplates();
  return <Onboarding templates={templates} profile={profile!} />;
}
