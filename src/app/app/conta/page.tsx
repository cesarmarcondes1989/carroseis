import { Account } from "@/components/Account";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Conta() {
  const { profile } = await getSession();
  return <Account profile={profile!} />;
}
