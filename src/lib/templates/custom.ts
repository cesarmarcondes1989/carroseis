import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { planActive } from "@/lib/credits";
import { TEMPLATES, getTemplate } from "@/lib/templates/registry";
import type { LayerTemplate } from "@/lib/layers/types";
import type { Carousel, Fonts, Palette, Profile, Template } from "@/lib/types";

export const USER_PREFIX = "user:";

/** Catálogo de templates (banco, com fallback no registro em código). */
export async function listTemplates(): Promise<Template[]> {
  const { data } = await adminClient().from("templates").select("*").eq("active", true).order("sort_order");
  return data && data.length ? (data as Template[]) : TEMPLATES;
}

export type UserTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  base_template_id: string;
  palette: Palette;
  fonts: Fonts;
  layers: LayerTemplate;
  supports_ai_cover: boolean;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
};

/** Editor de templates: só Agência ativo, contas ilimitadas e admins. */
export function canEditTemplates(profile: Pick<Profile, "plan" | "plan_expires_at" | "unlimited_credits" | "role">) {
  if (profile.unlimited_credits || profile.role === "admin") return true;
  return profile.plan === "agency" && planActive(profile);
}

export function rowToTemplate(r: UserTemplateRow): Template {
  return {
    id: `${USER_PREFIX}${r.id}`,
    name: r.name,
    description: r.description || "Meu template",
    description_en: r.description,
    category: "meus",
    layout: "niche",
    palette: r.palette,
    fonts: r.fonts,
    supports_ai_cover: r.supports_ai_cover,
    sort_order: 0,
    active: true,
    layers: r.layers,
    custom: true,
    user_template_id: r.id,
    base_template_id: r.base_template_id,
  };
}

export async function listUserTemplates(userId: string): Promise<UserTemplateRow[]> {
  const { data, error } = await adminClient().from("user_templates").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) console.error("listUserTemplates: falha ao consultar user_templates (rodou a migration 0005_user_templates.sql?)", error);
  return (data as UserTemplateRow[]) ?? [];
}

/** Catálogo + templates do usuário (os dele primeiro). */
export async function listTemplatesFor(userId: string): Promise<Template[]> {
  const [builtin, mine] = await Promise.all([listTemplates(), listUserTemplates(userId)]);
  return [...mine.map(rowToTemplate), ...builtin];
}

/** Aceita "marketing" ou "user:<uuid>". Devolve o template e, se for do usuário, o id da linha. */
export async function resolveTemplateId(id: string, userId: string): Promise<{ template: Template; userTemplateId: string | null }> {
  if (id.startsWith(USER_PREFIX)) {
    const uid = id.slice(USER_PREFIX.length);
    const { data, error } = await adminClient().from("user_templates").select("*").eq("id", uid).eq("user_id", userId).maybeSingle();
    if (error) console.error("resolveTemplateId: falha ao consultar user_templates", error);
    if (data) return { template: rowToTemplate(data as UserTemplateRow), userTemplateId: uid };
  }
  return { template: getTemplate(id, await listTemplates()), userTemplateId: null };
}

/** Template efetivo de um carrossel: o do usuário quando existe, senão o base. */
export async function templateForCarousel(carousel: Pick<Carousel, "template_id" | "user_template_id">): Promise<Template> {
  if (carousel.user_template_id) {
    const { data, error } = await adminClient().from("user_templates").select("*").eq("id", carousel.user_template_id).maybeSingle();
    if (error) console.error("templateForCarousel: falha ao consultar user_templates", error);
    if (data) return rowToTemplate(data as UserTemplateRow);
  }
  return getTemplate(carousel.template_id, await listTemplates());
}
