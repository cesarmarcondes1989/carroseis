import { AdminPanel } from "@/components/AdminPanel";
import { Stat } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { getDict } from "@/lib/i18n/server";
import { adminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { t } = await getDict();
  const { q } = await searchParams;
  const db = adminClient();
  let usersQ = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  if (q) usersQ = usersQ.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  const [{ data: users }, { count: carousels }, { data: payments }, { data: credits }] = await Promise.all([
    usersQ,
    db.from("carousels").select("*", { count: "exact", head: true }),
    db.from("payments").select("*, profiles(email)").order("created_at", { ascending: false }).limit(30),
    db.from("profiles").select("credits").eq("unlimited_credits", false),
  ]);
  const revenue = (payments ?? []).filter((p) => p.status === "approved").reduce((s, p) => s + p.amount_cents, 0);
  const { count: totalUsers } = await db.from("profiles").select("*", { count: "exact", head: true });
  const circulating = (credits ?? []).reduce((s, r) => s + r.credits, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{t.admin.title}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label={t.admin.stats.users} value={totalUsers ?? 0} />
        <Stat label={t.admin.stats.carousels} value={carousels ?? 0} />
        <Stat label={t.admin.stats.revenue} value={formatBRL(revenue)} sub="últimos 30 pagamentos" />
        <Stat label={t.admin.stats.credits} value={circulating} />
      </div>
      <AdminPanel users={(users as Profile[]) ?? []} payments={(payments as unknown as { id: string; status: string; amount_cents: number; plan_id: string; created_at: string; profiles: { email: string } | null }[]) ?? []} query={q ?? ""} />
    </div>
  );
}
