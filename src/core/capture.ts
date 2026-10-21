import { readFileSync } from "node:fs";
import { paths } from "../lib/config.ts";
import type { Item, SiteTokens } from "../lib/types.ts";
import { extensionFor, hasItem, idFor, readItem, writeAsset, writeItem } from "./store.ts";

export interface Captured {
  item: Item;
  duplicate: boolean;
}

function isUrl(source: string): boolean {
  return /^https?:\/\//i.test(source);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "Capturing a URL needs Playwright." +
        "\n  bun add playwright && bun run setup:browser" +
        "\nOr save a screenshot and pass the file path instead.",
    );
  }
}

/**
 * Screenshot a live page and read its real design tokens off the DOM. The token
 * script is the same file the browser extension injects, so both paths agree.
 */
async function captureUrl(url: string): Promise<{ bytes: Buffer; tokens: SiteTokens }> {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    } catch {
      // Plenty of real sites never go idle. A loaded DOM is enough.
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    }

    // Nudge lazy imagery into view, then return to the top for the hero shot.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);

    await page.addScriptTag({ path: paths.tokensScript });
    const tokens = (await page.evaluate(
      // @ts-expect-error injected by extension/tokens.js
      () => window.__grainExtractTokens(),
    )) as SiteTokens;

    const bytes = await page.screenshot({ fullPage: true, type: "png" });
    return { bytes: Buffer.from(bytes), tokens };
  } finally {
    await browser.close();
  }
}

/**
 * Save a source into the library and return immediately.
 *
 * Capture has to feel instant or you stop doing it, so this only writes bytes
 * and a stub record. The vision pass runs later, from `grain ingest`.
 */
export async function capture(source: string): Promise<Captured> {
  if (isUrl(source)) {
    const { bytes, tokens } = await captureUrl(source);
    return commit({ bytes, tokens, kind: "site", ext: ".png", source });
  }

  return commit({
    bytes: readFileSync(source),
    kind: "image",
    ext: extensionFor(source),
    source,
  });
}

/** Shared by the CLI and the extension endpoint. */
export function commit(input: {
  bytes: Buffer;
  tokens?: SiteTokens;
  kind: Item["kind"];
  ext: string;
  source: string;
}): Captured {
  const id = idFor(input.bytes);
  if (hasItem(id)) return { item: readItem(id), duplicate: true };

  const asset = `${id}${input.ext}`;
  writeAsset(asset, input.bytes);

  const item: Item = {
    id,
    kind: input.kind,
    source: input.source,
    capturedAt: new Date().toISOString(),
    asset,
    status: "pending",
    ...(input.tokens ? { tokens: input.tokens } : {}),
  };

  writeItem(item);
  return { item, duplicate: false };
}
