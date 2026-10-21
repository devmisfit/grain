import type { Item, Library } from "../lib/types.ts";
import { client } from "./client.ts";
import { theme } from "./theme.ts";

const ICON_EXPAND = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2H2v4M10 14h4v-4M14 6V2h-4M2 10v4h4"/></svg>`;
const ICON_PREV = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13 5 8l5-5"/></svg>`;
const ICON_NEXT = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>`;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Safe to embed inside a <script> tag. */
function json(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function card(item: Item, index: number, total: number): string {
  const family = item.family ?? "Unfiled";
  const counter = `${String(index).padStart(2, "0")} / ${total}`;

  if (!item.extract) {
    const label = item.source.replace(/^https?:\/\//, "").slice(0, 44);
    return `<article class="card" data-state="pending" data-family="${esc(family)}" data-id="${item.id}">
  <figure><img loading="lazy" src="assets/${esc(item.asset)}" alt=""></figure>
  <div class="card-body">
    <div class="card-head"><h2>${esc(label)}</h2></div>
    <div class="card-foot">
      <span class="family meta">${item.status === "failed" ? "Extraction failed" : "Queued for extraction"}</span>
      <span class="index">${counter}</span>
    </div>
  </div>
</article>`;
  }

  const extract = item.extract;
  const shown = extract.keywords.slice(0, 3);
  const remaining = extract.keywords.length - shown.length;

  return `<article class="card" data-family="${esc(family)}" data-id="${item.id}" tabindex="0" role="button" aria-label="${esc(extract.name)}">
  <figure>
    <img loading="lazy" src="assets/${esc(item.asset)}" alt="${esc(extract.name)}">
    <button class="zoom" data-zoom aria-label="View the full capture of ${esc(extract.name)}">${ICON_EXPAND}</button>
  </figure>
  <div class="card-body">
    <div class="card-head">
      <h2>${esc(extract.name)}</h2>
      <span class="descriptor">${esc(extract.descriptor)}</span>
    </div>
    <div class="tags">
      ${shown.map((keyword) => `<span class="tag">${esc(keyword)}</span>`).join("\n      ")}
      ${remaining > 0 ? `<span class="tag">+${remaining}</span>` : ""}
    </div>
    <div class="card-foot">
      <span class="family">${esc(family)}</span>
      <span class="index">${counter}</span>
    </div>
  </div>
</article>`;
}

export function renderPage(library: Library): string {
  const { items, families } = library;
  const pending = items.filter((item) => !item.extract);
  const ordered = [...pending, ...items.filter((item) => item.extract)];

  const filters = [
    `<button class="filter" data-family="*" aria-pressed="true">All<span class="n">${items.length}</span></button>`,
    ...families.map(
      (family) =>
        `<button class="filter" data-family="${esc(family.name)}" aria-pressed="false">${esc(family.name)}<span class="n">${family.itemIds.length}</span></button>`,
    ),
    ...(pending.length
      ? [`<button class="filter" data-family="Unfiled" aria-pressed="false">Queued<span class="n">${pending.length}</span></button>`]
      : []),
  ].join("\n        ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>grain</title>
<style>${theme}</style>
</head>
<body>

<header class="masthead">
  <div class="shell masthead-inner">
    <h1 class="wordmark">grain</h1>
    <span class="meta mono">${items.length} saved &middot; ${families.length} ${families.length === 1 ? "family" : "families"}</span>
  </div>
</header>

<nav class="shell" aria-label="Filter by family">
  <div class="filters">
        ${filters}
  </div>
</nav>

<main class="shell">
  <div class="grid" id="grid">
${ordered.map((item, index) => card(item, index + 1, items.length)).join("\n")}
${items.length === 0 ? '<p class="empty">Nothing saved yet.<br><code>bun run grain add &lt;url or file&gt;</code></p>' : ""}
  </div>
</main>

<dialog id="detail" aria-label="Reference detail"><div class="sheet" id="sheet"></div></dialog>

<dialog id="lightbox" aria-label="Full capture">
  <div class="viewer">
    <div class="viewer-bar">
      <span class="viewer-title" id="viewerTitle"></span>
      <span class="viewer-sub" id="viewerSub"></span>
      <span class="spacer"></span>
      <button class="button" id="fitWidth" aria-pressed="true">Fit width</button>
      <button class="button" id="fitWhole" aria-pressed="false">Fit whole</button>
      <a class="button" id="viewerRaw" target="_blank" rel="noopener">Open file</a>
      <button class="button" id="viewerClose">Close</button>
    </div>
    <div class="viewer-stage" id="viewerStage" data-fit="width"><img id="viewerImage" alt=""></div>
    <button class="viewer-nav" data-dir="prev" aria-label="Previous reference">${ICON_PREV}</button>
    <button class="viewer-nav" data-dir="next" aria-label="Next reference">${ICON_NEXT}</button>
  </div>
</dialog>

<script>
const ITEMS = ${json(Object.fromEntries(items.map((item) => [item.id, item])))};
${client}
</script>
</body>
</html>`;
}
