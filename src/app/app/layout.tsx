import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSession();
  if (!profile) redirect("/login?next=/app");
  return <AppShell profile={profile}>{children}</AppShell>;
}
