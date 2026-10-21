import { askJson } from "../lib/claude.ts";
import { prepare } from "../lib/image.ts";
import type { Extract, Item } from "../lib/types.ts";
import { assetPath, writeItem } from "./store.ts";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name", "descriptor", "thesis", "keywords", "aesthetic",
    "composition", "typeNotes", "colorNotes", "motionNotes", "imageRecipe", "brief",
  ],
  properties: {
    name: { type: "string" },
    descriptor: { type: "string" },
    thesis: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    aesthetic: { type: "string" },
    composition: {
      type: "object",
      additionalProperties: false,
      required: ["archetype", "hero", "negativeSpace", "grid"],
      properties: {
        archetype: { type: "string" },
        hero: { type: "string" },
        negativeSpace: { type: "string" },
        grid: { type: "string" },
      },
    },
    typeNotes: { type: "array", items: { type: "string" } },
    colorNotes: { type: "array", items: { type: "string" } },
    motionNotes: { type: "array", items: { type: "string" } },
    imageRecipe: { type: "string" },
    brief: { type: "string" },
  },
} as const;

const SYSTEM = `You catalogue design references for a working designer's private taste library.

Name what is physically happening in a design so it can be rebuilt later. Do not praise it.

Rules:
- Be concrete and visual: "halftone CMYK dot texture", "giant cropped footer wordmark", "mono coordinate labels", "split-screen form and art". Never "clean", "modern", "sleek", "elegant", "minimalist", "beautiful", "eye-catching".
- Name real mechanisms: what carries the eye, where the dead space sits, what the type is doing, where the grid breaks.
- Identify a typeface when you can. When you cannot, describe the letterforms rather than guessing a name.
- Write like a designer talking to themselves, not like marketing copy. No em-dashes.`;

const RECIPE_RULES = `imageRecipe is the most important field. It is a reusable prompt for an image model that locks THIS artwork's visual style while leaving the subject swappable.

- It MUST contain the literal token [SUBJECT] exactly once, where the depicted thing goes.
- Everything else describes style only: rendering technique, palette with specific named colors, lighting, material, framing, and the empty space a layout would need.
- Do not bake this reference's own subject matter into the style description.
- If the reference carries no illustrative artwork, write a recipe for imagery that would sit inside this design without clashing, and say so in one clause.

Example shape:
"[SUBJECT] built entirely from small 3D voxels, Minecraft-diorama style at high fidelity, STRICT muted palette: slate-blue and dusty navy with white snow, coral-salmon accent patches, sage-green foliage, no browns, soft even studio light, isolated diorama on a clean white ground with generous empty space above for typography"`;

function measuredBlock(item: Item): string {
  const tokens = item.tokens;
  if (!tokens) return "";

  const colors = tokens.colors
    .slice(0, 10)
    .map((color) => `${color.hex} (${color.areaPct}% of painted area, ${color.role})`)
    .join("; ");

  return `
MEASURED from the live page's DOM. These are read values, not guesses. Prefer them over anything you think you see in the screenshot, and quote the real numbers in your notes.

Page title: ${tokens.title}
Fonts in use: ${tokens.fonts.join(", ") || "none detected"}
Colors by painted area: ${colors || "none detected"}
Border radii: ${tokens.radii.join(", ") || "none detected"}
Shadows: ${tokens.shadows.slice(0, 4).join(" | ") || "none detected"}
Spacing scale: ${tokens.spacing.join(", ") || "none detected"}
Transitions: ${tokens.transitions.slice(0, 4).join(" | ") || "none detected"}
`;
}

export async function extractItem(item: Item): Promise<Item> {
  const images = await prepare(assetPath(item));

  const extract = await askJson<Extract>({
    system: SYSTEM,
    images,
    schema: SCHEMA as unknown as Record<string, unknown>,
    effort: "medium",
    maxTokens: 16000,
    prompt: `Catalogue this design reference.

Source: ${item.source}
${measuredBlock(item)}
Fields:
- name: a short memorable handle, 1-3 words, title case. Invent one if the design shows no product name.
- descriptor: the card subtitle, in the form "<thing> x <thing>", lowercase, e.g. "warm editorial x print DNA".
- thesis: ONE sentence naming the mechanism that makes it work. Not praise.
- keywords: 5-8 concrete visual chips, lowercase, each 2-5 words.
- aesthetic: 2-3 words naming the visual family, title case, e.g. "Vast Quiet Cinematic". Invent it; do not pick from a fixed list.
- composition.archetype: the layout pattern in a few words.
- composition.hero: where the focal element sits and how much room it takes.
- composition.negativeSpace: where the dead space is and what it is reserved for.
- composition.grid: column structure, alignment, and where it deliberately breaks.
- typeNotes: 2-4 notes on typefaces, scale jumps, weight, case, tracking.
- colorNotes: 2-4 notes naming actual colors and what each one is doing.
- motionNotes: 1-3 notes on implied or visible motion. Empty array if there is none.
- brief: one pasteable paragraph directing someone to build a NEW page in this direction. Describe the direction, not this page's content.

${RECIPE_RULES}`,
  });

  if (!extract.imageRecipe.includes("[SUBJECT]")) {
    extract.imageRecipe = await repairRecipe(extract.imageRecipe);
  }

  const updated: Item = { ...item, extract, status: "ready", error: undefined };
  writeItem(updated);
  return updated;
}

/** The [SUBJECT] slot is the whole point of a recipe, so never accept one without it. */
async function repairRecipe(recipe: string): Promise<string> {
  const { imageRecipe } = await askJson<{ imageRecipe: string }>({
    system: SYSTEM,
    effort: "low",
    maxTokens: 4000,
    prompt: `Rewrite this image prompt so the depicted subject is replaced by the literal token [SUBJECT], appearing exactly once, and everything else describes style only.

${recipe}`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["imageRecipe"],
      properties: { imageRecipe: { type: "string" } },
    },
  });

  return imageRecipe.includes("[SUBJECT]") ? imageRecipe : `[SUBJECT], ${recipe}`;
}
