import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { askText } from "../lib/claude.ts";
import { paths } from "../lib/config.ts";
import type { Item } from "../lib/types.ts";
import { search } from "./search.ts";
import { ensureLibrary } from "./store.ts";

export type Format = "prompt" | "tokens" | "design";

const SHAPES: Record<Format, { ext: string; instruction: string }> = {
  prompt: {
    ext: "md",
    instruction: `Write ONE pasteable prompt directing a coding agent to build a page in this direction.

Structure it as: aesthetic, then the references and what to take from each, then intent, then guardrails.
Be specific about composition, type, palette, and motion. Where measured values are given, use those exact
values rather than describing them loosely. Under guardrails, name what to avoid, drawn from what these
references pointedly do not do.

Output the prompt only. No preamble and no explanation of your choices.`,
  },
  tokens: {
    ext: "css",
    instruction: `Write a design-tokens.css file: a single :root block of CSS custom properties.

Ground every value in the measured tokens above wherever they exist. Where references disagree, pick one
coherent direction rather than averaging them into mud, and note which reference you followed in a comment.
Include color with semantic names (never --color-1), type families and a scale, spacing, radii, shadows,
and motion durations and easings.

Output CSS only. Comments are fine; prose outside the file is not.`,
  },
  design: {
    ext: "md",
    instruction: `Write a DESIGN.md a coding agent can follow to keep an app visually consistent.

Cover: the direction in a sentence, the palette and what each color is for, type (families, scale, when to
use mono), spacing and density, surfaces (radii, borders, shadows), motion, and a short "never do this" list
drawn from what these references avoid.

Ground it in the measured values where they exist. Output the document only.`,
  },
};

function describe(item: Item, index: number): string {
  const e = item.extract!;
  const lines = [
    `### Reference ${index + 1}: ${e.name} (${e.descriptor})`,
    `Family: ${item.family ?? e.aesthetic}`,
    `Source: ${item.source}`,
    `Why it works: ${e.thesis}`,
    `Keywords: ${e.keywords.join(", ")}`,
    `Composition: ${e.composition.archetype}. Hero: ${e.composition.hero}. Dead space: ${e.composition.negativeSpace}. Grid: ${e.composition.grid}.`,
    `Type: ${e.typeNotes.join("; ")}`,
    `Color: ${e.colorNotes.join("; ")}`,
    `Motion: ${e.motionNotes.join("; ") || "none"}`,
  ];

  if (item.tokens) {
    const t = item.tokens;
    lines.push(
      "MEASURED from the live page (use these exact values):",
      `  fonts: ${t.fonts.join(", ") || "none"}`,
      `  colors: ${t.colors.map((c) => `${c.hex}${c.areaPct ? ` ${c.areaPct}%` : ""} ${c.role}`).join("; ")}`,
      `  radii: ${t.radii.join(", ") || "none"}`,
      `  spacing: ${t.spacing.join(", ") || "none"}`,
      `  shadows: ${t.shadows.slice(0, 3).join(" | ") || "none"}`,
      `  transitions: ${t.transitions.slice(0, 3).join(" | ") || "none"}`,
    );
  }

  lines.push(`Its own brief: ${e.brief}`);
  return lines.join("\n");
}

function slug(query: string): string {
  return query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "brief";
}

export async function compose(
  query: string,
  format: Format,
  limit = 4,
): Promise<{ items: Item[]; text: string; path: string }> {
  const items = await search(query, limit);
  if (items.length === 0) {
    throw new Error("Nothing in the library matched. Add references, or run `grain ingest` first.");
  }

  const text = await askText({
    system:
      "You turn a designer's saved references into something they can paste straight into a build. " +
      "You are working from their taste, so follow the references rather than substituting your defaults. " +
      "Never produce generic AI-template aesthetics: no Inter, no purple-on-white gradients, no stock card grids. " +
      "No em-dashes in prose.",
    effort: "high",
    maxTokens: 24000,
    prompt: `The designer asked for: ${query}

Here are the ${items.length} references from their library that fit.

${items.map(describe).join("\n\n")}

---

${SHAPES[format].instruction}`,
  });

  ensureLibrary();
  const path = join(paths.out, `${slug(query)}.${SHAPES[format].ext}`);
  writeFileSync(path, `${text.trim()}\n`);

  return { items, text: text.trim(), path };
}
