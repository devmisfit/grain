import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Read `.env` beside package.json without taking on a dependency. */
function loadDotEnv(): void {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadDotEnv();

export const LIBRARY = process.env.GRAIN_LIBRARY ? resolve(process.env.GRAIN_LIBRARY) : join(ROOT, "library");

export const paths = {
  library: LIBRARY,
  assets: join(LIBRARY, "assets"),
  items: join(LIBRARY, "items"),
  fonts: join(LIBRARY, "fonts"),
  out: join(LIBRARY, "out"),
  families: join(LIBRARY, "families.json"),
  page: join(LIBRARY, "index.html"),
  tokensScript: join(ROOT, "extension", "tokens.js"),
  geistSans: join(ROOT, "node_modules", "geist", "dist", "fonts", "geist-sans", "Geist-Variable.woff2"),
  geistMono: join(ROOT, "node_modules", "geist", "dist", "fonts", "geist-mono", "GeistMono-Variable.woff2"),
} as const;

export const MODEL = process.env.GRAIN_MODEL ?? "claude-opus-5";
export const PORT = Number(process.env.GRAIN_PORT ?? 4610);

/** Claude Opus 5 accepts images up to 2576px on the long edge. */
export const MAX_IMAGE_EDGE = 2576;

export function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(
      "\nANTHROPIC_API_KEY is not set." +
        "\n  Set it in your shell, or copy .env.example to .env and put it there.\n",
    );
    process.exit(1);
  }
  return key;
}
