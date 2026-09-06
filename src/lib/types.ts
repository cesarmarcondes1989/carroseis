export type Aspect = "4:5" | "1:1";
export type CoverMode = "ai" | "own" | "none";
export type CarouselStatus = "draft" | "generating" | "rendering" | "ready" | "error";
export type CarouselSource = "topic" | "url" | "youtube" | "pdf" | "script" | "mcp";
export type PlanId = "free" | "weekly" | "creator" | "pro" | "agency";
export type Layout = "social" | "insider" | "identity" | "fulltext" | "niche" | "news";

export type Palette = {
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  accent2: string;
  cycle?: string[];
};

export type Fonts = { display: string; body: string };

export type Template = {
  id: string;
  name: string;
  description: string;
  description_en?: string | null;
  category: string;
  layout: Layout;
  palette: Palette;
  fonts: Fonts;
  supports_ai_cover: boolean;
  sort_order: number;
  active?: boolean;
  /** Template por camadas (editor). Quando presente, o render usa o LayerCanvas. */
  layers?: import("@/lib/layers/types").LayerTemplate | null;
  custom?: boolean;
  user_template_id?: string;
  base_template_id?: string;
};

export type Slide = {
  titulo: string;
  texto?: string;
  etiqueta?: string;
};

export type BrandOverrides = {
  palette?: Partial<Palette>;
  font_display?: string | null;
  font_body?: string | null;
  text_scale?: number;
  instagram_handle?: string | null;
  variant?: "dark" | "light";
};

export type BrandModel = {
  id: string;
  user_id: string;
  name: string;
  template_id: string | null;
  user_template_id?: string | null;
  palette: Partial<Palette> | null;
  font_display: string | null;
  font_body: string | null;
  text_scale: number;
  instagram_handle: string | null;
  is_default: boolean;
};

export type Render = { index: number; path: string; url: string };

export type Carousel = {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  user_template_id: string | null;
  brand_model_id: string | null;
  aspect: Aspect;
  status: CarouselStatus;
  source: CarouselSource;
  source_input: string | null;
  slides: Slide[];
  caption: string | null;
  hashtags: string[] | null;
  cover_mode: CoverMode;
  cover_scene: string | null;
  cover_image_path: string | null;
  cover_ai_charged: boolean;
  brand_overrides: BrandOverrides | null;
  instagram_handle: string | null;
  renders: Render[];
  seamless: boolean;
  credits_spent: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  credits: number;
  unlimited_credits: boolean;
  plan: PlanId;
  plan_expires_at: string | null;
  locale: string;
  instagram_handle: string | null;
  last_active_at: string | null;
  is_banned: boolean;
  banned_reason: string | null;
  admin_notes: string | null;
  onboarded_at: string | null;
  onboarding: OnboardingAnswers | null;
  created_at: string;
};

export type OnboardingAnswers = {
  niche: string;
  goal: string;
  tone: string;
  handle?: string | null;
  templateId?: string;
  topics?: string[];
};

export type Plan = {
  id: PlanId;
  name: string;
  price_cents: number;
  credits: number;
  period_days: number;
  highlight: boolean;
  active: boolean;
  sort_order: number;
};

export type ApiKey = {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  calls: number;
  revoked_at: string | null;
  created_at: string;
};

export const CREDIT_COST = {
  carousel: 1,
  aiCover: 10,
  aiScript: 2,
} as const;

export const SIZES: Record<Aspect, { w: number; h: number }> = {
  "4:5": { w: 1080, h: 1350 },
  "1:1": { w: 1080, h: 1080 },
};
