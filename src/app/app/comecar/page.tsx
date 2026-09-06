import { Onboarding } from "@/components/Onboarding";
import { listTemplatesFor } from "@/lib/templates/custom";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Comecar() {
  const { profile } = await getSession();
  const templates = await listTemplatesFor(profile!.id);
  return <Onboarding templates={templates} profile={profile!} />;
}
