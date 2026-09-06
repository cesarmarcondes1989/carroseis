import { z } from "zod";
import { handleError, HttpError, requireProfile } from "@/lib/api";
import { adminClient } from "@/lib/supabase/admin";
import { createCheckout } from "@/lib/payments/mercadopago";
import type { Plan } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const profile = await requireProfile();
    const { planId } = z.object({ planId: z.enum(["weekly", "creator", "pro", "agency"]) }).parse(await req.json());
    const { data: plan } = await adminClient().from("plans").select("*").eq("id", planId).eq("active", true).maybeSingle();
    if (!plan) throw new HttpError(404, "Plano não encontrado.");
    const { url } = await createCheckout(profile, plan as Plan);
    return Response.json({ url });
  } catch (e) {
    return handleError(e);
  }
}
