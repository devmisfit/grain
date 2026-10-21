import { compose, type Format } from "../core/compose.ts";

/** Compose the references that match a query into something pasteable. */
export async function brief(query: string, format: Format, limit = 4): Promise<void> {
  const { items, text, path } = await compose(query, format, limit);

  console.log(`Drawing on: ${items.map((item) => item.extract!.name).join(", ")}\n`);
  console.log(text);
  console.log(`\nWritten to ${path}`);
}
