import { CatalogEditor } from "@/components/admin/CatalogEditor";
import { adminClient } from "@/lib/supabase/admin";
import type { Plan, Template } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Catalogo() {
  const db = adminClient();
  const [{ data: plans }, { data: templates }] = await Promise.all([db.from("plans").select("*").order("sort_order"), db.from("templates").select("*").order("sort_order")]);
  return <CatalogEditor plans={(plans as Plan[]) ?? []} templates={(templates as Template[]) ?? []} />;
}
