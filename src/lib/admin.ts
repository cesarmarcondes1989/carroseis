import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { HttpError, requireProfile } from "@/lib/api";
import type { Profile } from "@/lib/types";

export const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? "contato@cesar-marcondes.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isOwnerEmail(email: string | null | undefined) {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<Profile> {
  const p = await requireProfile();
  if (p.role !== "admin") throw new HttpError(403, "Só admin.");
  return p;
}

export async function requireOwner(): Promise<Profile> {
  const p = await requireAdmin();
  if (!isOwnerEmail(p.email)) throw new HttpError(403, "Só a conta dona pode fazer isso.");
  return p;
}

export async function audit(actor: Profile, action: string, target?: { id?: string | null; email?: string | null } | null, meta?: Record<string, unknown>) {
  await adminClient().from("admin_audit").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action,
    target_id: target?.id ?? null,
    target_email: target?.email ?? null,
    meta: meta ?? null,
  });
}

export type DailyPoint = { date: string; signups: number; carousels: number; mcp: number; ai_covers: number; credits: number; revenue_cents: number; payments: number; active_users: number };
export type AdminStats = {
  daily: DailyPoint[];
  totals: Record<string, number>;
  breakdowns: {
    templates: { id: string; name: string; count: number }[];
    sources: { source: string; count: number }[];
    plans: { plan: string; count: number }[];
    covers: { mode: string; count: number }[];
    statuses: { status: string; count: number }[];
  };
  top_users: { id: string; email: string; full_name: string | null; plan: string; credits: number; unlimited: boolean; carousels: number; spent: number }[];
  generated_at: string;
};

export async function getAdminStats(days = 30): Promise<AdminStats> {
  const { data, error } = await adminClient().rpc("admin_stats", { p_days: days });
  if (error) throw error;
  return data as AdminStats;
}

export type UserSummary = { carousels: number; carousels_ready: number; credits_spent: number; credits_bought: number; revenue_cents: number; downloads: number; mcp_calls: number; last_event: string | null };

export async function getUserSummary(userId: string): Promise<UserSummary> {
  const { data, error } = await adminClient().rpc("admin_user_summary", { p_user: userId });
  if (error) throw error;
  return data as UserSummary;
}

/** Regras de privilégio: ninguém mexe na dona; só a dona mexe em outros admins. */
export function assertCanManage(actor: Profile, target: Pick<Profile, "id" | "email" | "role">) {
  if (isOwnerEmail(target.email) && !isOwnerEmail(actor.email)) throw new HttpError(403, "A conta dona é protegida.");
  if (target.role === "admin" && target.id !== actor.id && !isOwnerEmail(actor.email)) throw new HttpError(403, "Só a conta dona altera outros admins.");
}
