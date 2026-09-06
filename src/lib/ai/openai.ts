import "server-only";
import OpenAI from "openai";
import type { AIProvider, ScriptRequest, ScriptResult, SuggestRequest, SuggestResult } from "./provider";
import { coverPrompt, parseScript, parseSuggest, suggestPrompt, systemPrompt, userPrompt } from "./prompts";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private textModel = process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";
  private imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

  async generateScript(req: ScriptRequest): Promise<ScriptResult> {
    const res = await this.client.chat.completions.create({
      model: this.textModel,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(req) },
        { role: "user", content: userPrompt(req) },
      ],
    });
    return parseScript(res.choices[0]?.message?.content ?? "{}", req.slidesCount);
  }

  async suggest(req: SuggestRequest): Promise<SuggestResult> {
    const res = await this.client.chat.completions.create({
      model: this.textModel,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: suggestPrompt(req) }],
    });
    return parseSuggest(res.choices[0]?.message?.content ?? "{}", req.templates.map((t) => t.id));
  }

  async generateCoverImage(scene: string, aspect: "4:5" | "1:1") {
    const res = await this.client.images.generate({
      model: this.imageModel,
      prompt: coverPrompt(scene, ""),
      size: aspect === "1:1" ? "1024x1024" : "1024x1536",
      quality: (process.env.OPENAI_IMAGE_QUALITY as "low" | "medium" | "high" | undefined) ?? "medium",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("A geração da capa falhou.");
    return { buffer: Buffer.from(b64, "base64"), mime: "image/png" };
  }
}
