#!/usr/bin/env bun
import { add } from "./commands/add.ts";
import { brief } from "./commands/brief.ts";
import { build } from "./commands/build.ts";
import { ingest } from "./commands/ingest.ts";
import { list } from "./commands/list.ts";
import { serve } from "./commands/serve.ts";
import type { Format } from "./core/compose.ts";
import { paths, PORT } from "./lib/config.ts";

const HELP = `grain — a taste library

  add <url|file...>    Save references. Instant; extraction is queued.
                         --now            extract immediately
  ingest               Extract new items, regroup the library, rebuild the page
                         --retry-failed   also retry items that errored
  build                Rebuild the page from what is already extracted
  serve                Serve the library and accept captures from the extension
  list [query]         Offline keyword search
  brief <query>        Compose from the references that match
                         --prompt         a build prompt (default)
                         --tokens         a design-tokens.css
                         --design         a DESIGN.md
                         --limit <n>      references to draw on (default 4)
  where                Print the page path and local address

Examples
  bun run grain add https://linear.app ~/Desktop/shot.png
  bun run grain ingest
  bun run grain brief "dark editorial hero with a lot of dead space"
  bun run grain brief "the ledger direction" --tokens
`;

const args = process.argv.slice(3);

const has = (flag: string) => args.includes(`--${flag}`);
const valueOf = (flag: string) => {
  const index = args.indexOf(`--${flag}`);
  return index === -1 ? undefined : args[index + 1];
};

/** Positional arguments, skipping flags and the values they consume. */
const positional = (): string[] => {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      if (arg === "--limit") i++;
      continue;
    }
    out.push(arg);
  }
  return out;
};

async function main(): Promise<void> {
  switch (process.argv[2] ?? "help") {
    case "add": {
      const sources = positional();
      if (sources.length === 0) {
        console.error("Nothing to add. Pass a URL or a file path.");
        process.exit(1);
      }
      await add(sources, { now: has("now") });
      break;
    }

    case "ingest": {
      const result = await ingest({ retryFailed: has("retry-failed") });
      console.log(`\n${result.page}`);
      break;
    }

    case "build":
      console.log(build());
      break;

    case "serve":
      serve();
      break;

    case "list":
      list(positional().join(" "), Number(valueOf("limit") ?? 20));
      break;

    case "brief": {
      const query = positional().join(" ");
      if (!query) {
        console.error('Give it something to work from, e.g. brief "dark editorial hero"');
        process.exit(1);
      }
      const format: Format = has("tokens") ? "tokens" : has("design") ? "design" : "prompt";
      await brief(query, format, Number(valueOf("limit") ?? 4));
      break;
    }

    case "where":
      console.log(paths.page);
      console.log(`http://localhost:${PORT}`);
      break;

    default:
      console.log(HELP);
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
