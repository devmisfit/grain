import { capture } from "../core/capture.ts";
import { extractItem } from "../core/extract.ts";
import { ingest } from "./ingest.ts";

/**
 * Save one or more sources. URLs go through a real browser for a full-page
 * capture plus measured tokens; anything else is read from disk.
 */
export async function add(sources: string[], options: { now?: boolean } = {}): Promise<void> {
  for (const source of sources) {
    try {
      const { item, duplicate } = await capture(source);
      console.log(`${duplicate ? "already saved" : "saved"}  ${item.id}  ${source}`);

      if (!duplicate && options.now) {
        const done = await extractItem(item);
        console.log(`               ${done.extract!.name} — ${done.extract!.descriptor}`);
      }
    } catch (error) {
      console.error(`failed        ${source}`);
      console.error(`               ${String(error).split("\n").join("\n               ")}`);
    }
  }

  if (options.now) {
    await ingest();
  } else {
    console.log("\nRun `bun run grain ingest` when you're ready to extract.");
  }
}
