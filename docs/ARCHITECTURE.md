# Architecture

Four stages, in order. Each one is independently runnable from the CLI.

```
capture  →  extract  →  cluster  →  compose
```

## Layout

```
src/
  cli.ts            argument parsing, dispatch, nothing else
  commands/         one file per CLI verb; orchestration only
  core/             the domain: capture, extract, cluster, search, compose, store
  lib/              plumbing: config, types, the Claude client, image prep
  ui/               the generated page: theme, markup, client script
extension/
  tokens.js         the DOM reader, shared with Playwright
docs/
library/            your data, gitignored
```

The dependency rule is one-directional: `commands` may import `core` and `lib`; `core` may import `lib`; `lib` imports nothing local. `ui` is imported only by `commands/build.ts`.

## Stages

**Capture** (`core/capture.ts`) writes bytes and a stub record, then returns. It never calls a model, because a save that takes three seconds is a save you stop making. URLs go through Playwright for a full-page screenshot plus measured tokens; files are read straight from disk. Records are content-addressed, so re-adding the same bytes is a no-op.

**Extract** (`core/extract.ts`) runs one vision pass per pending item. For a site, the measured tokens are handed over as fact, so the model annotates real values instead of guessing at a screenshot. The output includes an `imageRecipe` that must contain a literal `[SUBJECT]` slot; a repair pass rewrites any recipe that comes back without one.

**Cluster** (`core/cluster.ts`) regroups the entire library on every ingest and invents the family names from what is actually there. This is the stage most likely to be broken by a well-meaning refactor: assigning a family per item as it arrives yields one family per item. Existing names are fed back in and reused wherever they still fit, so the shelf stays stable between runs.

**Compose** (`core/compose.ts`) retrieves via `core/search.ts` and emits a build prompt, a `design-tokens.css`, or a `DESIGN.md`. Search asks the model to pick from a compact index rather than maintaining an embedding store; at library scale the whole index is a few thousand tokens, and there is nothing to keep in sync.

## Data

Plain JSON on disk. No database.

```
library/
  items/<id>.json    one record per reference
  assets/<id>.png    the capture
  fonts/             Geist, copied in at build so the page works offline
  families.json      the current grouping
  index.html         the generated page
  out/               composed briefs, tokens, design docs
```

`library/items/*.json` is the integration surface. Point a coding agent at that glob and it can read your taste directly.

## The token reader

`extension/tokens.js` is deliberately plain, dependency-free JavaScript with no build step, because two very different callers load it: Playwright injects it via `addScriptTag`, and the Chrome extension injects it via `chrome.scripting.executeScript`. One file means both paths cannot drift.

It measures rather than infers: colours are ranked by painted area, fonts are weighted by rendered text volume, and only transitions carrying a real duration are kept.
