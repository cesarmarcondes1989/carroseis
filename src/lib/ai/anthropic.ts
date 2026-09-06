import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, DesignRequest, DesignResult, ScriptRequest, ScriptResult, SeriesPlan, SeriesRequest, SuggestRequest, SuggestResult } from "./provider";
import { designPrompt, parseDesign, parseScript, parseSeries, parseSuggest, seriesPrompt, suggestPrompt, systemPrompt, userPrompt } from "./prompts";
import { OpenAIProvider } from "./openai";

/**
 * Provedor Anthropic. Ative com AI_PROVIDER=anthropic e ANTHROPIC_API_KEY.
 * Imagem de capa continua na OpenAI (Claude não gera imagem).
 */
export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  private images = new OpenAIProvider();

  async generateScript(req: ScriptRequest): Promise<ScriptResult> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0.8,
      system: systemPrompt(req),
      messages: [{ role: "user", content: userPrompt(req) }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return parseScript(text, req.slidesCount);
  }

  async suggest(req: SuggestRequest): Promise<SuggestResult> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      temperature: 0.9,
      messages: [{ role: "user", content: suggestPrompt(req) }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return parseSuggest(text, req.templates.map((t) => t.id));
  }

  async planSeries(req: SeriesRequest): Promise<SeriesPlan> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: "user", content: seriesPrompt(req) }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return parseSeries(text, req.count);
  }

  async designAgent(req: DesignRequest): Promise<DesignResult> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 6000,
      temperature: 0.4,
      messages: [{ role: "user", content: designPrompt(req) }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return parseDesign(text);
  }

  generateCoverImage(scene: string, aspect: "4:5" | "1:1" | "wide") {
    return this.images.generateCoverImage(scene, aspect);
  }
}
