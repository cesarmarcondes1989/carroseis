import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSession();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/app");
  return <AppShell profile={profile}>{children}</AppShell>;
}
