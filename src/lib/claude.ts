import Anthropic from "@anthropic-ai/sdk";
import { MODEL, requireApiKey } from "./config.ts";
import type { ModelImage } from "./image.ts";

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (!cached) cached = new Anthropic({ apiKey: requireApiKey() });
  return cached;
}

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface AskOptions {
  system: string;
  prompt: string;
  images?: ModelImage[];
  /** JSON Schema. Every object needs `additionalProperties: false` and a full `required`. */
  schema?: Record<string, unknown>;
  effort?: Effort;
  maxTokens?: number;
}

function content(prompt: string, images: ModelImage[]) {
  const blocks: unknown[] = [];

  for (const image of images) {
    blocks.push({ type: "text", text: `Image — ${image.label}:` });
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: image.mediaType, data: image.data },
    });
  }

  blocks.push({ type: "text", text: prompt });
  return blocks;
}

async function send({ system, prompt, images = [], schema, effort, maxTokens }: AskOptions): Promise<string> {
  const outputConfig: Record<string, unknown> = {};
  if (effort) outputConfig.effort = effort;
  if (schema) outputConfig.format = { type: "json_schema", schema };

  // Streaming keeps large max_tokens under the HTTP timeout. Thinking is on by
  // default on Opus 5 and counts against max_tokens, so leave real headroom.
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: maxTokens ?? 32000,
    system,
    messages: [{ role: "user", content: content(prompt, images) }],
    ...(Object.keys(outputConfig).length ? { output_config: outputConfig } : {}),
    // The `output_config` type moves between SDK releases; the wire format is stable.
  } as Parameters<Anthropic["messages"]["stream"]>[0]);

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (message.stop_reason === "max_tokens") {
    throw new Error("Response hit max_tokens. Raise maxTokens or lower effort.");
  }

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function askJson<T>(options: AskOptions & { schema: Record<string, unknown> }): Promise<T> {
  const text = await send(options);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON, received:\n${text.slice(0, 400)}`);
  }
}

export function askText(options: AskOptions): Promise<string> {
  return send(options);
}
