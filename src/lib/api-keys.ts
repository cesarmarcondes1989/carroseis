import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export const KEY_PREFIX = "cia_";

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function generateKey() {
  const key = KEY_PREFIX + randomBytes(24).toString("base64url");
  return { key, hash: hashKey(key), prefix: key.slice(0, 10) };
}

/** Resolve uma chave para o perfil dono. Atualiza uso. */
export async function resolveApiKey(key: string | null | undefined): Promise<Profile | null> {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;
  const db = adminClient();
  const { data: row } = await db.from("api_keys").select("id, user_id, revoked_at, calls").eq("key_hash", hashKey(key)).maybeSingle();
  if (!row || row.revoked_at) return null;
  const { data: profile } = await db.from("profiles").select("*").eq("id", row.user_id).single();
  if (!profile || profile.is_banned) return null;
  await db.from("api_keys").update({ last_used_at: new Date().toISOString(), calls: (row.calls ?? 0) + 1 }).eq("id", row.id);
  return profile as Profile;
}
