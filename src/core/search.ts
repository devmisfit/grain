import { askJson } from "../lib/claude.ts";
import type { Item } from "../lib/types.ts";
import { readyItems } from "./store.ts";

function haystack(item: Item): string {
  const extract = item.extract;
  if (!extract) return item.source.toLowerCase();

  return [
    extract.name, extract.descriptor, extract.thesis, extract.aesthetic, item.family ?? "",
    extract.keywords.join(" "), extract.typeNotes.join(" "), extract.colorNotes.join(" "),
    extract.composition.archetype, extract.composition.hero, item.source,
  ]
    .join(" ")
    .toLowerCase();
}

/** Instant, offline, no API call. Backs `grain list`. */
export function keywordSearch(items: Item[], query: string, limit = 12): Item[] {
  if (!query.trim()) return items.slice(0, limit);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      const text = haystack(item);
      return { item, score: terms.reduce((n, term) => n + (text.includes(term) ? 1 : 0), 0) };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.item);
}

/**
 * Semantic search, by asking the model to pick from a compact index.
 *
 * At library scale the whole index is a few thousand tokens, so this beats an
 * embedding store on both quality and setup cost, and there is no index to keep
 * in sync with the library.
 */
export async function search(query: string, limit = 5): Promise<Item[]> {
  const items = readyItems();
  if (items.length === 0) return [];
  if (items.length <= limit) return items;

  const index = items
    .map((item) => {
      const e = item.extract!;
      return `${item.id} | ${e.name} | ${item.family ?? e.aesthetic} | ${e.descriptor} | ${e.keywords.join(", ")}`;
    })
    .join("\n");

  const { itemIds } = await askJson<{ itemIds: string[]; reasoning: string }>({
    system:
      "You retrieve design references from a designer's private library. " +
      "Match on visual character, not literal word overlap. Return only genuinely relevant entries, best first. " +
      "If fewer than requested genuinely fit, return fewer.",
    effort: "low",
    maxTokens: 8000,
    prompt: `Query: ${query}

Return up to ${limit} ids from this index, best first.

id | name | family | descriptor | keywords
${index}`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["itemIds", "reasoning"],
      properties: {
        itemIds: { type: "array", items: { type: "string" } },
        reasoning: { type: "string" },
      },
    },
  });

  const byId = new Map(items.map((item) => [item.id, item]));
  const hits = itemIds.map((id) => byId.get(id)).filter((item): item is Item => Boolean(item));
  return hits.length ? hits.slice(0, limit) : keywordSearch(items, query, limit);
}
