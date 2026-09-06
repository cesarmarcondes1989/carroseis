import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ScriptRequest, ScriptResult } from "./provider";
import { parseScript, systemPrompt, userPrompt } from "./prompts";
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

  generateCoverImage(scene: string, aspect: "4:5" | "1:1") {
    return this.images.generateCoverImage(scene, aspect);
  }
}
