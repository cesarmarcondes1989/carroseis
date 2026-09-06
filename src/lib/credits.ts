import "server-only";
import { adminClient } from "@/lib/supabase/admin";

export class InsufficientCredits extends Error {
  constructor() {
    super("INSUFFICIENT_CREDITS");
  }
}

type Kind = "carousel" | "ai_cover" | "admin_adjust" | "refund" | "bonus" | "purchase";

/** Desconta créditos de forma atômica (RPC). Lança InsufficientCredits. */
export async function consumeCredits(userId: string, amount: number, kind: Kind, description: string, referenceId?: string) {
  if (amount <= 0) return null;
  const { data, error } = await adminClient().rpc("consume_credits", {
    p_user: userId,
    p_amount: amount,
    p_kind: kind,
    p_description: description,
    p_reference: referenceId ?? null,
  });
  if (error) {
    if (error.message.includes("INSUFFICIENT_CREDITS")) throw new InsufficientCredits();
    throw error;
  }
  return data as number;
}

export async function grantCredits(userId: string, amount: number, kind: Kind, description: string, referenceId?: string, by?: string) {
  const { data, error } = await adminClient().rpc("grant_credits", {
    p_user: userId,
    p_amount: amount,
    p_kind: kind,
    p_description: description,
    p_reference: referenceId ?? null,
    p_by: by ?? null,
  });
  if (error) throw error;
  return data as number;
}

export async function logUsage(userId: string | null, event: string, meta?: Record<string, unknown>) {
  await adminClient().from("usage_events").insert({ user_id: userId, event, meta: meta ?? null });
}

export function planActive(profile: { plan: string; plan_expires_at: string | null; unlimited_credits: boolean; role: string }) {
  if (profile.unlimited_credits || profile.role === "admin") return true;
  if (profile.plan === "free") return false;
  return !!profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date();
}
