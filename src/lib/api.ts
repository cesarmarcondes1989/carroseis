import "server-only";
import { getSession } from "@/lib/supabase/server";
import { InsufficientCredits } from "@/lib/credits";
import { ZodError } from "zod";
import type { Profile } from "@/lib/types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireProfile(): Promise<Profile> {
  const { profile } = await getSession();
  if (!profile) throw new HttpError(401, "Faça login.");
  if (profile.is_banned) throw new HttpError(403, "BANNED");
  return profile;
}

const FIELD_LABELS: Record<string, string> = { topic: "tema", url: "link", script: "roteiro", handle: "@ do Instagram", coverScene: "cena da capa", slidesCount: "quantidade de cards", name: "nome", email: "email", credits: "créditos" };

export function zodMessage(e: ZodError) {
  const issue = e.issues[0];
  if (!issue) return "Dados inválidos.";
  const field = FIELD_LABELS[String(issue.path[0] ?? "")] ?? String(issue.path[0] ?? "campo");
  if (issue.code === "too_big" && "maximum" in issue) return `O ${field} passou do limite de ${Number(issue.maximum).toLocaleString("pt-BR")} caracteres.`;
  if (issue.code === "too_small" && "minimum" in issue) return Number(issue.minimum) <= 1 ? `Preencha o ${field}.` : `O ${field} precisa de pelo menos ${issue.minimum} caracteres.`;
  if (issue.code === "invalid_format") return `O ${field} está num formato inválido.`;
  return `Confira o ${field}: ${issue.message}`;
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) return Response.json({ error: zodMessage(e) }, { status: 400 });
  if (e instanceof InsufficientCredits) return Response.json({ error: "INSUFFICIENT_CREDITS", message: "Créditos insuficientes." }, { status: 402 });
  const msg = e instanceof Error ? e.message : "Erro inesperado";
  console.error(e);
  return Response.json({ error: msg }, { status: 500 });
}

export async function getOwnedCarousel(id: string, profile: Profile) {
  const { adminClient } = await import("@/lib/supabase/admin");
  const q = adminClient().from("carousels").select("*").eq("id", id);
  const { data } = await (profile.role === "admin" ? q : q.eq("user_id", profile.id)).maybeSingle();
  if (!data) throw new HttpError(404, "Carrossel não encontrado.");
  return data as import("@/lib/types").Carousel;
}
