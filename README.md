# grain

A taste library. Save the designs you like, extract what actually makes them work, and get that back as something you can paste into a build.

Not a bookmark manager. The saved image is the receipt; the useful artifact is the structured brief pulled out of it.

```
capture  →  extract  →  cluster  →  compose
```

**Capture** is instant. One hotkey in the browser, or `grain add` in the terminal. Nothing to name, nothing to file.

**Extract** runs a vision pass over each new item and writes a record: a name, concrete visual keywords, a one-sentence thesis on the mechanism, composition notes, and two pasteable artifacts.

**Cluster** regroups the whole library into named aesthetic families that emerge from what you have actually collected. You never sort anything.

**Compose** turns a plain-language query into a build prompt, a `design-tokens.css`, or a `DESIGN.md`.

## Setup

```bash
bun install
cp .env.example .env     # add your ANTHROPIC_API_KEY
```

Capturing live URLs from the terminal needs a browser. Dropping in screenshots does not.

```bash
bun run setup:browser
```

## Use it

```bash
bun run grain add https://linear.app ~/Desktop/shot.png
bun run grain ingest
bun run serve                # then open http://localhost:4610
```

Once there are a few things in there:

```bash
bun run grain brief "dark editorial hero with a lot of dead space"
bun run grain brief "the ledger direction" --tokens
bun run grain brief "what I keep saving" --design --limit 6
```

`grain list [query]` is offline keyword search and makes no API calls. `grain brief` runs a semantic pass over the index, so it finds things you did not literally name.

The page is a plain file, so `library/index.html` opens on its own. You only need `serve` when you want the extension to post into it.

## The browser extension

`chrome://extensions` → Developer mode → **Load unpacked** → pick `extension/`.

Click the toolbar button or press `Cmd+Shift+S` on any page. It saves and returns immediately; extraction happens back on the server. Set a different address in the extension's options if grain runs on another machine.

The extension captures the viewport plus the page's real design tokens. For a full-page screenshot use `grain add <url>`, which drives a real browser.

## Three decisions worth knowing about

**Live URLs give you ground truth, screenshots do not.** For a real page, `extension/tokens.js` reads the DOM directly: the fonts actually in use, hex colours ranked by how much of the viewport they paint, real radii, shadows, spacing, transitions. Those measured values are handed to the model as fact and flow through to `--tokens` output. A screenshot only ever gets you a guess at the palette.

**Families are re-derived over the whole library, every ingest.** Tagging each item on arrival would give you one family per item, which is folders with extra steps. Because grouping sees everything at once, one new reference can legitimately rename or merge existing groups. Existing names are reused wherever they still fit.

**Image recipes have a `[SUBJECT]` slot.** The style is locked in prose and the subject is a variable, so one saved reference becomes unlimited on-style images.

## Docs

- [Architecture](docs/ARCHITECTURE.md) — the stages, the layout, the dependency rule
- [Design](docs/DESIGN.md) — the interface foundation, following [vercel.com/design.md](https://vercel.com/design.md)

## Where things live

```
library/
  items/<id>.json    one record per reference
  assets/<id>.png    the capture
  families.json      the current grouping
  index.html         the generated page
  out/               composed briefs, tokens, design docs
```

Everything is plain JSON on disk and content-addressed, so re-adding the same file is a no-op. Point a coding agent at `library/items/*.json` and it can read your taste directly. That is the whole integration; no MCP server required.

`library/` is gitignored. Delete that line in `.gitignore` if you would rather version it.

## Cost

One vision call per new item, plus one grouping call per ingest. `brief` is one search call plus one generation call. Nothing runs on a schedule and nothing runs unless you ask.
