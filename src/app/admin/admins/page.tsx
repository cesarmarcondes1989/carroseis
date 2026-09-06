import { AdminsManager } from "@/components/admin/AdminsManager";
import { isOwnerEmail, OWNER_EMAILS } from "@/lib/admin";
import { adminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Admins() {
  const { profile } = await getSession();
  const { data } = await adminClient().from("profiles").select("*").eq("role", "admin").order("created_at");
  const admins = ((data as Profile[]) ?? []).map((a) => ({ id: a.id, email: a.email, full_name: a.full_name, created_at: a.created_at, last_active_at: a.last_active_at, owner: isOwnerEmail(a.email) }));
  return <AdminsManager admins={admins} actorIsOwner={isOwnerEmail(profile?.email)} ownerEmails={OWNER_EMAILS} />;
}
