import { askJson } from "../lib/claude.ts";
import type { Family, Item } from "../lib/types.ts";
import { readFamilies, readyItems, writeFamilies, writeItem } from "./store.ts";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["families"],
  properties: {
    families: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "note", "itemIds"],
        properties: {
          name: { type: "string" },
          note: { type: "string" },
          itemIds: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

/** Below this there is nothing meaningful to cluster. */
const MIN_TO_CLUSTER = 4;

function summarize(item: Item): string {
  const extract = item.extract!;
  return [
    `id: ${item.id}`,
    `name: ${extract.name}`,
    `descriptor: ${extract.descriptor}`,
    `its own guess at a family: ${extract.aesthetic}`,
    `keywords: ${extract.keywords.join(", ")}`,
    `thesis: ${extract.thesis}`,
    `type: ${extract.typeNotes.join("; ")}`,
    `color: ${extract.colorNotes.join("; ")}`,
  ].join("\n");
}

/**
 * Group the library into named aesthetic families.
 *
 * This runs over the ENTIRE collection every time, never per item on arrival.
 * Families are meant to emerge from what has actually been collected, so a new
 * reference can legitimately rename or merge existing groups. Tagging on arrival
 * instead produces N families of one, which is folders with extra steps.
 */
export async function recluster(): Promise<Family[]> {
  const items = readyItems();

  if (items.length === 0) {
    writeFamilies([]);
    return [];
  }

  if (items.length < MIN_TO_CLUSTER) {
    const byName = new Map<string, Family>();
    for (const item of items) {
      const name = item.extract!.aesthetic;
      const family = byName.get(name) ?? { name, note: item.extract!.thesis, itemIds: [] };
      family.itemIds.push(item.id);
      byName.set(name, family);
    }
    const families = [...byName.values()];
    persist(items, families);
    return families;
  }

  const existing = readFamilies().map((family) => family.name);
  const reuse = existing.length
    ? `\nThese family names already exist. Reuse a name verbatim wherever it still fits, so the library stays stable between runs. Rename or merge one only when the collection has genuinely shifted under it:\n${existing.map((name) => `- ${name}`).join("\n")}\n`
    : "";

  const { families } = await askJson<{ families: Family[] }>({
    system: `You organise a designer's private reference library into aesthetic families.

A family is a group of references sharing a visual world, so that "build five pages, one per family" yields five genuinely different directions.

- Invent family names from what is actually in this collection. No preset taxonomy, and no generic labels like "Modern", "Minimal", "Bold", or "Clean".
- Good names are specific and evocative: "Vast Quiet Cinematic", "Print-Tech Paper", "Dither Mono", "Data-as-Texture", "Glitched Antiquity".
- Aim for groups of roughly 2-8. Prefer fewer meaningful families over many tiny ones.
- Every item appears in exactly one family. Never drop an item and never place one twice.`,
    schema: SCHEMA as unknown as Record<string, unknown>,
    effort: "high",
    maxTokens: 24000,
    prompt: `Group these ${items.length} references into aesthetic families.
${reuse}
For each family give: name (2-3 words, title case), note (one sentence on what holds the group together), and itemIds.

Use only these ids, and use every one of them exactly once:
${items.map((item) => item.id).join(", ")}

---
${items.map(summarize).join("\n\n---\n\n")}`,
  });

  const reconciled = reconcile(items, families);
  persist(items, reconciled);
  return reconciled;
}

/** Trust but verify: drop unknown ids, de-duplicate, and sweep up anything missed. */
function reconcile(items: Item[], families: Family[]): Family[] {
  const valid = new Set(items.map((item) => item.id));
  const placed = new Set<string>();
  const out: Family[] = [];

  for (const family of families) {
    const itemIds = (family.itemIds ?? []).filter((id) => {
      if (!valid.has(id) || placed.has(id)) return false;
      placed.add(id);
      return true;
    });
    if (itemIds.length) out.push({ name: family.name, note: family.note ?? "", itemIds });
  }

  const missed = items.filter((item) => !placed.has(item.id));
  if (missed.length) {
    out.push({
      name: "Unfiled",
      note: "Not placed by the last grouping pass.",
      itemIds: missed.map((item) => item.id),
    });
  }

  return out.sort((a, b) => b.itemIds.length - a.itemIds.length || a.name.localeCompare(b.name));
}

function persist(items: Item[], families: Family[]): void {
  const familyOf = new Map<string, string>();
  for (const family of families) {
    for (const id of family.itemIds) familyOf.set(id, family.name);
  }

  for (const item of items) {
    const next = familyOf.get(item.id);
    if (item.family !== next) writeItem({ ...item, family: next });
  }

  writeFamilies(families);
}
