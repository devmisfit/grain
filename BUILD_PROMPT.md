# Build prompt: a personal taste library

Paste everything below the line into a fresh Claude Code session in an empty directory. It is self-contained.

---

Build me a personal **taste library**: I save designs I like, and it extracts what actually makes them work so I can paste that back into a build later.

It is not a bookmark manager. The saved image is the receipt. The useful artifact is the structured brief pulled out of it.

Work in this directory. Do not assume any other project exists.

## Naming

Before scaffolding anything, propose **five** names and let me pick. Constraints: one word, lowercase, short enough to type as a CLI verb dozens of times a day, evocative of taste or reference or material rather than literally describing storage. Check that each is free on npm and not an obvious GitHub collision. Do not use "grain".

Throughout this spec the tool is written as `<name>`. Substitute my pick everywhere: package name, CLI binary, wordmark, docs.

If I do not answer, pick the strongest one and say which you chose and why.

## The pipeline

```
capture  →  extract  →  cluster  →  compose
```

**Capture** saves bytes and a stub record, then returns immediately. It never calls a model. A save that takes three seconds is a save I stop making.

**Extract** runs one vision pass per pending item and writes a structured record.

**Cluster** regroups the entire library into named aesthetic families that emerge from what I have actually collected.

**Compose** turns a plain-language query into a pasteable build prompt, a `design-tokens.css`, or a `DESIGN.md`.

## Prior art

Study these before you start. **Do not clone any of them.** They are here so you understand the shape of the space and do not accidentally rebuild a worse version of something that already exists.

**Closest in spirit, worth reading:**

- **[karakeep-app/karakeep](https://github.com/karakeep-app/karakeep)** — ~28k stars, TypeScript, actively maintained. Self-hostable "bookmark everything" with AI auto-tagging and full-text search. The strongest project in this space. Take from it: ingestion-queue robustness, browser-extension UX, how it handles partial and failed captures. **Do not build on it — it is AGPL-3.0, which is viral.** It also stops where this project starts: its tags are flat labels, not design vocabulary, and it never reads a page's real CSS or emits anything you can paste into a build.
- **[pinry/pinry](https://github.com/pinry/pinry)** — ~3.4k stars, Python, BSD-2, going stale. A self-hosted tiling image board. Take from it: the masonry board feel, if aspect-preserving tiles ever beat uniform cards here. It has no AI and no extraction at all; it is pure storage.
- **[go-shiori/shiori](https://github.com/go-shiori/shiori)** — ~11.5k stars, Go, MIT. A simple self-hosted bookmark manager. Take from it: the clean single-binary CLI-plus-server shape. No visual or design angle.
- **[ArchiveBox/ArchiveBox](https://github.com/ArchiveBox/ArchiveBox)** — ~28k stars. Web archiving. Take from it: discipline about capture fidelity and never losing an original. Not design-focused.
- **AugusJiayu/UI-Design-Collector** — near-zero stars, essentially unproven, but conceptually the closest thing on GitHub: a design-inspiration clipboard with AI element analysis. Worth a skim to see what the naive version looks like.

**Commercial products to study as UX reference only:** Eagle (the heavyweight local asset manager), Mymind (AI auto-tagging, no folders), Are.na (manual, communal), Savee and Cosmos (image-first browsing). None of them read CSS off a live page, and none of them emit a prompt or a token file.

**The gap all of them leave, which is the entire reason this project exists:** nobody reads real design tokens off a live DOM, and nobody composes the collection back out into something you can paste into a build. Everything else here is table stakes.

**Component patterns worth borrowing** (structure, not code — this project is vanilla JS, not React): 21st.dev's *Gallery Grid with Lightbox* for the lightbox with wrap-around navigation and hover zoom affordance, and its *Shared Element Gallery* for aspect-preserving masonry.

## Stack

- **Bun** + TypeScript, ESM, `"type": "module"`. No bundler, no framework, no React.
- `@anthropic-ai/sdk` for model calls.
- `playwright` as an **optional** dependency, only for capturing live URLs. Dropping screenshots in must work without it.
- `geist` from npm, for the fonts.
- The generated page is a single self-contained HTML file with inline CSS and JS. No build step for it.
- `tsc --noEmit` must pass. Run it after every meaningful change.

Read `ANTHROPIC_API_KEY` from the environment or from a `.env` file beside `package.json`. Parse that file yourself in about fifteen lines; do not add a dotenv dependency.

## Repo layout

```
src/
  cli.ts            argument parsing and dispatch, nothing else
  commands/         one file per CLI verb: add, ingest, build, serve, list, brief
  core/             the domain: capture, extract, cluster, search, compose, store
  lib/              plumbing: config, types, the Claude client, image prep
  ui/               theme.ts, render.ts, client.ts
extension/          manifest, background, options, tokens.js
docs/               ARCHITECTURE.md, DESIGN.md
library/            my data, gitignored
```

Enforce a one-directional dependency rule: `commands` may import `core` and `lib`; `core` may import `lib`; `lib` imports nothing local. `ui` is imported only by `commands/build.ts`.

`src/ui/theme.ts` holds every visual value in the project. `render.ts` is markup only and `client.ts` is behaviour only — neither may contain a colour or a size.

## CLI

```
<name> add <url|file...>    save references, instant; --now extracts immediately
<name> ingest               extract new items, regroup, rebuild; --retry-failed
<name> build                rebuild the page from what is already extracted
<name> serve                serve the library and accept captures from the extension
<name> list [query]         offline keyword search, no API calls
<name> brief <query>        compose; --prompt (default) | --tokens | --design | --limit N
<name> where                print the page path and local address
```

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

Ids are a truncated SHA-256 of the file bytes, so re-adding the same image is a no-op rather than a duplicate.

`library/items/*.json` is the integration surface. A coding agent should be able to read that glob directly and understand my taste. That is the whole integration; do not build an MCP server.

An item record carries: `id`, `kind` (`site` or `image`), `source`, `capturedAt`, `asset`, `status` (`pending` | `ready` | `failed`), optional `tokens`, optional `extract`, optional `family`.

The `extract` object carries: `name`, `descriptor`, `thesis`, `keywords[]`, `aesthetic`, `composition` (`archetype`, `hero`, `negativeSpace`, `grid`), `typeNotes[]`, `colorNotes[]`, `motionNotes[]`, `imageRecipe`, `brief`.

## Three decisions that define the product

Get these wrong and it is just another bookmark app, and the prior art above already does that better.

### 1. Live URLs give ground truth; screenshots do not

For a real page, read the design tokens off the DOM rather than letting a model guess at a screenshot. Write `extension/tokens.js` as plain, dependency-free JavaScript with no build step, because two very different callers load it: Playwright via `addScriptTag`, and the Chrome extension via `chrome.scripting.executeScript`. One file means the two paths cannot drift.

It must **measure**, not infer:

- Colours ranked by **share of painted area** (element area × background colour), plus text colours weighted by rendered text volume, plus border colours. Tag each with a role.
- Fonts weighted by how much text is actually set in them. Drop generic families (`serif`, `sans-serif`, `system-ui`).
- Border radii, box shadows, spacing values, transitions — each deduplicated and ranked by frequency.
- Only keep transitions that carry a real duration. The computed shorthand is often a bare `all`, which tells you nothing.
- Cap the element walk at a few thousand nodes so it stays fast.

Hand these measured values to the model as fact, and say so in the prompt: prefer them over anything you think you see in the screenshot. They flow through to `--tokens` output.

### 2. Clustering runs over the whole library, every ingest

Families must emerge from the whole collection and the model must invent the names. Feed the existing family names back in and tell it to reuse any that still fit, so the shelf stays stable between runs.

**Do not assign a family per item as it arrives.** That yields one family per item, which is folders with extra steps. This is the single most likely thing to be broken by a well-meaning refactor, so comment it.

Below about four items, skip the model call and group by each item's own guess. After the model returns, reconcile defensively: drop unknown ids, de-duplicate, and sweep anything it missed into an `Unfiled` group.

Ban generic names in the prompt: no "Modern", "Minimal", "Bold", "Clean". Ask for specific, evocative ones — "Vast Quiet Cinematic", "Print-Tech Paper", "Dither Mono", "Data-as-Texture".

### 3. Image recipes carry a `[SUBJECT]` slot

`imageRecipe` is a reusable prompt that locks the reference's visual style while leaving the subject swappable. It must contain the literal token `[SUBJECT]` exactly once. Everything else describes style only: rendering technique, named palette colours, lighting, material, framing, and the empty space a layout would need. The reference's own subject matter must not be baked into the style description.

Validate it. If a recipe comes back without the slot, run a cheap repair pass that rewrites it, and fall back to prefixing `[SUBJECT], ` if that also fails.

## Model usage

Use `claude-opus-5`.

- Use **streaming** (`client.messages.stream(...)` then `.finalMessage()`), so large `max_tokens` cannot hit an HTTP timeout.
- Thinking is **on by default** on Opus 5 and counts against `max_tokens`. Leave real headroom; do not size `max_tokens` tightly around the expected answer.
- Use structured outputs: `output_config: { format: { type: "json_schema", schema } }`. Every object in the schema needs `additionalProperties: false` and a complete `required` array. No `minLength`/`maxLength`/`minItems` — they are unsupported.
- Set `output_config.effort` per task: `medium` for per-item extraction, `high` for clustering and composition, `low` for search and the recipe repair.
- Check `stop_reason` for `refusal` and `max_tokens` and throw a clear error rather than parsing garbage.

**Vision input.** Full-page captures are routinely 1440×9000. Scaling one to fit the model's 2576px long edge makes the type illegible, which is exactly the information you want. So for tall captures send **two** images: a legible crop of the top viewport for detail, and a downscaled whole-page view for structure. Use `ffmpeg`/`ffprobe` if present and fall back to sending the original when they are not.

**Search.** Do not build an embedding store. At library scale the whole index is a few thousand tokens, so send a compact index (`id | name | family | descriptor | keywords`) and ask the model to pick. Nothing to keep in sync. Keep a pure keyword search alongside it for the `list` command, so that command never makes an API call.

**Extraction prompt voice.** Demand concrete, visual language: "halftone CMYK dot texture", "giant cropped footer wordmark", "mono coordinate labels". Explicitly ban "clean", "modern", "sleek", "elegant", "minimalist", "beautiful", "eye-catching". The `thesis` field is one sentence naming the mechanism that makes the design work, not praise. No em-dashes anywhere in generated copy.

## Interface

Follow **https://vercel.com/design.md**. Fetch it, and fetch the stylesheet it points at (`https://vercel.com/geist/vercel-brand.css`) for the real token values. If those are unreachable, the resolved values are:

```
background-100  light-dark(oklch(1 0 0), oklch(0 0 0))
background-200  light-dark(oklch(0.984 0 0), oklch(0.027 0 0))
gray-100        light-dark(oklch(0.961 0 0), oklch(0.218 0 0))
gray-200        light-dark(oklch(0.94 0 0),  oklch(0.239 0 0))
gray-300        light-dark(oklch(0.925 0 0), oklch(0.281 0 0))
gray-400        light-dark(oklch(0.937 0 0), oklch(0.301 0 0))
gray-500        light-dark(oklch(0.836 0 0), oklch(0.39 0 0))
gray-600        light-dark(oklch(0.732 0 0), oklch(0.623 0 0))
gray-700        light-dark(oklch(0.65 0 0),  oklch(0.65 0 0))
gray-800        light-dark(oklch(0.59 0 0),  oklch(0.59 0 0))
gray-900        light-dark(oklch(0.42 0 0),  oklch(0.706 0 0))
gray-1000       light-dark(oklch(0.205 0 0), oklch(0.946 0 0))
surface-contrast oklch(0.205 0 0)
text-on-contrast oklch(0.946 0 0)

type   2rem / 1.5rem / 1.25rem / 1.125rem / 1rem / 0.875rem / 0.8125rem
weight 400 regular, 450 heading, 500 medium, 600 semibold
lead   body 24px, compact 20px, caption 18px, title 40px, section 32px, subsection 26px
space  4 8 12 16 20 24 32 40 48 64
control-height 36px    content-width 1200px    reading measure 68ch
```

Their border tokens resolve through gray-alpha variables the sheet does not expose. Derive three and mark them as derived in a comment.

Rules to follow:

- **Typeface is Geist.** Install the `geist` npm package and copy `Geist-Variable.woff2` and `GeistMono-Variable.woff2` into `library/fonts/` at build time, referenced by relative `@font-face`. The page must render correctly offline and survive being moved away from `node_modules`. Geist Mono is for ids, hex values, paths, spacing values, and counters only.
- **Radius is 3px everywhere.** Vercel publishes 6px and 8px; 3px is my call. Apply it consistently and mark it in a comment as a deliberate departure.
- **Theming is implicit.** `color-scheme: light dark` plus `light-dark()` tokens. No switcher, no toggle. It follows the OS.
- **Honour their rejection list**, quoted from the source: no decorative gradients, gradient text, glows, blobs, stripes, textures, grid backgrounds, glass effects, paper simulations, coloured side rails, ornamental shadows, or fake depth. Separation is carried by borders and space. The saved work supplies every bit of colour on the page; the chrome supplies none.
- **Tables carry measured data.** Text columns and their headers align left; numeric columns and their headers align right. Caption the colour table with its base ("ranked by share of the painted area") — a number without its base is not evidence.
- **Metadata stays visible.** Keywords sit on the card, not behind a hover, so the grid reads without interaction.
- **Motion is functional only.** Short linear border transitions, nothing else. No transforms, no staggered entrances, no pulsing. Honour `prefers-reduced-motion`.
- `font-variant-numeric: tabular-nums` globally, so counters and percentages align down a column.

### Layout

A masthead with the wordmark and a count. A filter row of family chips using `aria-pressed`. A card grid, `auto-fill` with a ~288px minimum. Each card: cropped thumbnail, name, descriptor, three keyword chips plus an overflow count, family and an index counter.

Clicking a card opens a detail sheet: capture, name, descriptor, thesis, all keywords, the image recipe with `[SUBJECT]` marked, the brief, the action buttons, and **then** the measured table. Put the actions above the table — the recipe and brief are the payoff, and the table can run to sixteen rows of supporting evidence.

Actions: copy image prompt (primary), copy brief, copy tokens (emits a `:root` block of CSS custom properties from the measured values), open source, close.

### Full-capture viewer

I must be able to see the entire image, not a crop. Build a lightbox with:

- A toolbar: title, family, an `n / m` counter, **Fit width** / **Fit whole** toggle, open-file link, close.
- **Fit width** is the default: the image fills the frame and the stage scrolls. This is how you read a full-page screenshot.
- **Fit whole** letterboxes every pixel on screen.
- Previous/next buttons and arrow-key navigation, wrapping around, over the **currently visible** cards so it respects the active filter.
- Escape and backdrop click dismiss. The image itself does not dismiss.
- Reachable from a zoom affordance that appears on card hover, and from the detail sheet's capture.

Three CSS traps here, all of which will silently look fine while being wrong:

1. A `1fr` grid row defaults to `min-height: auto`, so the stage grows to the image's natural height. Set `min-height: 0` on it.
2. A percentage `max-height` on a grid item resolves against an auto-sized row, which is circular and does nothing. For fit-whole use `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain` instead.
3. `width: auto` on a **replaced** element (an `img`) sizes from intrinsic dimensions, so absolute `inset` is ignored. Set explicit `100%` and use border-box padding to inset the picture.

Also reset default paragraph margins inside flex-gap blocks, or the spacing doubles.

## Browser extension

Manifest V3. `activeTab`, `scripting`, `storage`, and host permission for localhost.

One click on the toolbar button or a `Cmd+Shift+S` command captures the visible tab, injects `tokens.js` to read the design tokens, POSTs both to the local server, and returns immediately. Badge the result: ok, duplicate, or error. Extraction happens back on the server, never in the extension.

Handle pages that block injection (strict CSP, `chrome://` URLs) by saving the screenshot alone rather than failing.

An options page sets the server address, so the library can live on another machine. Style it with the same tokens as the main page.

## Server

`Bun.serve`. Routes: `GET /` (rebuild and serve the page so it is never stale), `GET /assets/*`, `GET /fonts/*`, `POST /capture`, `GET /health`. CORS open, since the caller is a local extension.

Run `basename()` on any path segment before joining it to a directory, so a crafted request cannot walk out.

After a capture, trigger ingest **debounced** — a burst of captures should produce one pass, not one each.

## Verification

Do not tell me it works. Show me:

1. `tsc --noEmit` clean.
2. Capture a real design-forward site end to end and print the extracted tokens. Confirm the fonts and colours match what that site actually uses — this is the feature, so prove it.
3. Confirm re-adding the same file is a no-op.
4. Drive the generated page with headless Playwright: assert zero console errors, that Geist actually loaded (`document.fonts.check('16px "Geist"')`) rather than falling back, that the computed card radius is exactly `3px`, that the viewer's fit-whole mode really does fit within the viewport, and that arrow-key navigation wraps.
5. Screenshot the grid and the viewer in both light and dark, and show me.

Be honest about what you could not verify. If there is no API key available, say plainly that the extract, cluster, search, and compose paths have never actually run.

## Docs

Write a `README.md` a stranger could follow, plus `docs/ARCHITECTURE.md` (the stages, the layout, the dependency rule) and `docs/DESIGN.md` (the foundation, the departures from Vercel's published values, and the rules the layout follows).

In the README, credit the prior art honestly and say in one line what this does that they do not.

Comment the non-obvious things — the clustering rule, the `[SUBJECT]` validation, the CSS traps above, the shared token script. Skip comments that restate the code.

Initialise a git repo and gitignore `library/` and `.env`.
