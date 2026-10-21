import { recluster } from "../core/cluster.ts";
import { extractItem } from "../core/extract.ts";
import { readItems, writeItem } from "../core/store.ts";
import type { Item } from "../lib/types.ts";
import { build } from "./build.ts";

const CONCURRENCY = 3;

async function pool(jobs: (() => Promise<void>)[], size: number): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(size, jobs.length) }, async () => {
    while (next < jobs.length) await jobs[next++]!();
  });
  await Promise.all(workers);
}

export interface IngestResult {
  extracted: number;
  failed: number;
  families: number;
  page: string;
}

/**
 * Extract anything new, regroup the whole library, rebuild the page.
 *
 * Re-running is cheap: extracted items are skipped, but the grouping pass always
 * reruns, because one new reference can legitimately redraw the family lines.
 */
export async function ingest(options: { quiet?: boolean; retryFailed?: boolean } = {}): Promise<IngestResult> {
  const log = options.quiet ? () => {} : (...args: unknown[]) => console.log(...args);

  const wanted = (item: Item) => item.status === "pending" || (options.retryFailed && item.status === "failed");
  const queue = readItems().filter(wanted);

  let extracted = 0;
  let failed = 0;

  if (queue.length === 0) {
    log("Nothing new to extract.");
  } else {
    log(`Extracting ${queue.length} item${queue.length === 1 ? "" : "s"}\n`);

    await pool(
      queue.map((item) => async () => {
        const label = item.source.replace(/^https?:\/\//, "").slice(0, 48);
        try {
          const done = await extractItem(item);
          extracted++;
          log(`  ok    ${done.extract!.name.padEnd(22)} ${label}`);
        } catch (error) {
          failed++;
          writeItem({ ...item, status: "failed", error: String(error) });
          log(`  fail  ${"".padEnd(22)} ${label}`);
          log(`        ${String(error).split("\n")[0]}`);
        }
      }),
      CONCURRENCY,
    );
  }

  log("\nRegrouping the library");
  const families = await recluster();
  const page = build();

  const summary = families.map((family) => `${family.name} (${family.itemIds.length})`).join(", ");
  log(`\n${families.length} famil${families.length === 1 ? "y" : "ies"}: ${summary || "none"}`);

  return { extracted, failed, families: families.length, page };
}
