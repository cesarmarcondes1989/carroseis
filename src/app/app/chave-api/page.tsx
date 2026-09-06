import { ApiKeys } from "@/components/ApiKeys";
import { getSession } from "@/lib/supabase/server";
import type { ApiKey } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChaveApi() {
  const { supabase } = await getSession();
  const { data } = await supabase.from("api_keys").select("id, user_id, name, key_prefix, last_used_at, calls, revoked_at, created_at").is("revoked_at", null).order("created_at", { ascending: false });
  return <ApiKeys keys={(data as ApiKey[]) ?? []} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""} />;
}
