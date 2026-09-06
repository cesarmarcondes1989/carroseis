import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cliente com service_role: ignora RLS. Só no servidor, nunca exponha. */
export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function publicStorageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/carousels/${path}`;
}
