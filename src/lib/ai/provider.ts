import "server-only";
import type { Slide } from "@/lib/types";

export type ScriptRequest = {
  topic: string;
  sourceText?: string | null;
  templateName: string;
  templateHint: string;
  slidesCount: number;
  tone: string;
  locale: "pt-BR" | "en";
  handle?: string | null;
  highlightWords?: boolean;
};

export type ScriptResult = {
  title: string;
  slides: Slide[];
  caption: string;
  hashtags: string[];
  coverScene: string;
};

export type SuggestRequest = { niche: string; goal: string; tone: string; locale: "pt-BR" | "en"; templates: { id: string; name: string; description: string }[] };
export type SuggestResult = { templateId: string; topics: string[]; why: string };

export type DesignRequest = {
  instruction: string;
  role: "cover" | "inner" | "last";
  layers: import("@/lib/layers/types").Layer[];
  palette: Record<string, unknown>;
  fonts: { display: string; body: string };
  aspect: "4:5" | "1:1";
  locale: "pt-BR" | "en";
};
export type DesignResult = { layers: import("@/lib/layers/types").Layer[]; message: string; palette?: Record<string, string> | null };

export interface AIProvider {
  name: string;
  generateScript(req: ScriptRequest): Promise<ScriptResult>;
  suggest(req: SuggestRequest): Promise<SuggestResult>;
  designAgent(req: DesignRequest): Promise<DesignResult>;
  /** Devolve PNG/JPEG em Buffer. */
  generateCoverImage(scene: string, aspect: "4:5" | "1:1" | "wide"): Promise<{ buffer: Buffer; mime: string }>;
}

let cached: AIProvider | null = null;

/**
 * Troca de LLM por variável de ambiente: AI_PROVIDER=openai | anthropic.
 * Geração de imagem continua na OpenAI (gpt-image-1) em qualquer caso.
 */
export async function getAI(): Promise<AIProvider> {
  if (cached) return cached;
  const which = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (which === "anthropic") {
    const { AnthropicProvider } = await import("./anthropic");
    cached = new AnthropicProvider();
  } else {
    const { OpenAIProvider } = await import("./openai");
    cached = new OpenAIProvider();
  }
  return cached;
}
