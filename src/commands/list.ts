import { keywordSearch } from "../core/search.ts";
import { readItems } from "../core/store.ts";

/** Offline keyword search. Makes no API calls. */
export function list(query: string, limit = 20): void {
  const items = readItems();
  const hits = keywordSearch(items, query, limit);

  if (hits.length === 0) {
    console.log(items.length === 0 ? "Library is empty." : "No matches.");
    return;
  }

  for (const item of hits) {
    const extract = item.extract;
    const family = (item.family ?? "pending").slice(0, 22).padEnd(24);
    const name = (extract?.name ?? item.source.replace(/^https?:\/\//, "")).slice(0, 24).padEnd(26);
    console.log(`${item.id}  ${family}${name}${extract?.descriptor ?? item.status}`);
  }

  console.log(`\n${hits.length} of ${items.length}`);
}
