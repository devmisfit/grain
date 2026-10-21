import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { paths } from "../lib/config.ts";
import type { Family, Item, Library } from "../lib/types.ts";

export function ensureLibrary(): void {
  for (const dir of [paths.library, paths.assets, paths.items, paths.fonts, paths.out]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

/** Content-addressed, so re-adding the same bytes is a no-op instead of a duplicate. */
export function idFor(bytes: Uint8Array | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 12);
}

export function itemPath(id: string): string {
  return join(paths.items, `${id}.json`);
}

export function assetPath(item: Item): string {
  return join(paths.assets, item.asset);
}

export function hasItem(id: string): boolean {
  return existsSync(itemPath(id));
}

export function readItem(id: string): Item {
  return JSON.parse(readFileSync(itemPath(id), "utf8")) as Item;
}

export function writeItem(item: Item): void {
  ensureLibrary();
  writeFileSync(itemPath(item.id), `${JSON.stringify(item, null, 2)}\n`);
}

export function writeAsset(name: string, bytes: Uint8Array | Buffer): void {
  ensureLibrary();
  writeFileSync(join(paths.assets, name), bytes);
}

export function readItems(): Item[] {
  ensureLibrary();
  return readdirSync(paths.items)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(join(paths.items, file), "utf8")) as Item)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

export function readyItems(): Item[] {
  return readItems().filter((item) => item.status === "ready" && item.extract);
}

export function readFamilies(): Family[] {
  if (!existsSync(paths.families)) return [];
  return JSON.parse(readFileSync(paths.families, "utf8")) as Family[];
}

export function writeFamilies(families: Family[]): void {
  ensureLibrary();
  writeFileSync(paths.families, `${JSON.stringify(families, null, 2)}\n`);
}

export function readLibrary(): Library {
  return { items: readItems(), families: readFamilies() };
}

export function extensionFor(source: string, fallback = ".png"): string {
  const ext = extname(source.split("?")[0] ?? "").toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext) ? ext : fallback;
}

/**
 * Copy Geist into the library so the page renders correctly offline and stays
 * portable if the folder is moved away from node_modules.
 */
export function syncFonts(): void {
  ensureLibrary();
  const fonts: [string, string][] = [
    [paths.geistSans, "Geist-Variable.woff2"],
    [paths.geistMono, "GeistMono-Variable.woff2"],
  ];

  for (const [from, name] of fonts) {
    const to = join(paths.fonts, name);
    if (existsSync(from) && !existsSync(to)) copyFileSync(from, to);
  }
}
