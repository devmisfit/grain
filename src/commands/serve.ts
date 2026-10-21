import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { commit } from "../core/capture.ts";
import { paths, PORT } from "../lib/config.ts";
import type { SiteTokens } from "../lib/types.ts";
import { build } from "./build.ts";
import { ingest } from "./ingest.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let ingesting = false;
let queued = false;

/** Debounced, so a burst of captures triggers one pass rather than one each. */
async function ingestSoon(): Promise<void> {
  if (ingesting) {
    queued = true;
    return;
  }

  ingesting = true;
  try {
    await ingest();
  } catch (error) {
    console.error("ingest failed:", error);
  } finally {
    ingesting = false;
    if (queued) {
      queued = false;
      void ingestSoon();
    }
  }
}

interface CapturePayload {
  source: string;
  /** data:image/png;base64,... */
  image: string;
  tokens?: SiteTokens;
}

export function serve(): void {
  if (!existsSync(paths.page)) build();

  const server = Bun.serve({
    port: PORT,
    async fetch(request) {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

      if (url.pathname === "/health") {
        return Response.json({ ok: true, ingesting }, { headers: CORS });
      }

      if (url.pathname === "/capture" && request.method === "POST") {
        try {
          const body = (await request.json()) as CapturePayload;
          if (!body?.image || !body?.source) {
            return Response.json({ ok: false, error: "need source and image" }, { status: 400, headers: CORS });
          }

          const { item, duplicate } = commit({
            bytes: Buffer.from(body.image.replace(/^data:image\/\w+;base64,/, ""), "base64"),
            tokens: body.tokens,
            kind: body.tokens ? "site" : "image",
            ext: ".png",
            source: body.source,
          });

          console.log(`${duplicate ? "dupe " : "saved"}  ${body.source}`);
          if (!duplicate) void ingestSoon();

          return Response.json({ ok: true, id: item.id, duplicate }, { headers: CORS });
        } catch (error) {
          return Response.json({ ok: false, error: String(error) }, { status: 500, headers: CORS });
        }
      }

      // basename() stops a crafted path from walking out of the served directory.
      for (const [prefix, dir] of [["/assets/", paths.assets], ["/fonts/", paths.fonts]] as const) {
        if (url.pathname.startsWith(prefix)) {
          const file = Bun.file(join(dir, basename(decodeURIComponent(url.pathname))));
          if (await file.exists()) {
            return new Response(file, { headers: { "cache-control": "public, max-age=86400" } });
          }
          return new Response("not found", { status: 404 });
        }
      }

      if (url.pathname === "/" || url.pathname === "/index.html") {
        // Rebuild on load so the page is never stale after a background ingest.
        build();
        return new Response(Bun.file(paths.page), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });
      }

      return new Response("not found", { status: 404 });
    },
  });

  console.log(`\n  grain  http://localhost:${server.port}`);
  console.log(`  Point the browser extension at this address. Ctrl-C to stop.\n`);
}
