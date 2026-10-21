/**
 * Design foundation, following https://vercel.com/design.md.
 *
 * Token values are taken from Vercel's published `vercel-brand.css`: the OKLCH
 * gray ramp, the type scale, the weight and leading sets, and the 4-to-64
 * spacing scale. Two deliberate departures are marked inline: the radius, which
 * this project pins to 3px, and the gray alpha ramp, which the published sheet
 * resolves through variables it does not expose.
 *
 * The doctrine that matters most here is the rejection list. No gradients, no
 * gradient text, no glows, no textures, no grid backgrounds, no glass, no paper
 * simulation, no ornamental shadows, no fake depth. Separation is carried by
 * borders and space. The saved work supplies every bit of colour on the page.
 */
export const theme = `
@font-face {
  font-family: "Geist";
  src: url("fonts/Geist-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "Geist Mono";
  src: url("fonts/GeistMono-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

:root {
  color-scheme: light dark;

  /* Background and gray ramp, verbatim from vercel-brand.css */
  --background-100: light-dark(oklch(1 0 0), oklch(0 0 0));
  --background-200: light-dark(oklch(0.984 0 0), oklch(0.027 0 0));
  --gray-100: light-dark(oklch(0.961 0 0), oklch(0.218 0 0));
  --gray-200: light-dark(oklch(0.94 0 0), oklch(0.239 0 0));
  --gray-300: light-dark(oklch(0.925 0 0), oklch(0.281 0 0));
  --gray-400: light-dark(oklch(0.937 0 0), oklch(0.301 0 0));
  --gray-500: light-dark(oklch(0.836 0 0), oklch(0.39 0 0));
  --gray-600: light-dark(oklch(0.732 0 0), oklch(0.623 0 0));
  --gray-700: light-dark(oklch(0.65 0 0), oklch(0.65 0 0));
  --gray-800: light-dark(oklch(0.59 0 0), oklch(0.59 0 0));
  --gray-900: light-dark(oklch(0.42 0 0), oklch(0.706 0 0));
  --gray-1000: light-dark(oklch(0.205 0 0), oklch(0.946 0 0));

  /* Derived: the published sheet resolves borders through alpha vars it does not expose. */
  --gray-alpha-300: light-dark(oklch(0 0 0 / 0.08), oklch(1 0 0 / 0.09));
  --gray-alpha-400: light-dark(oklch(0 0 0 / 0.12), oklch(1 0 0 / 0.14));
  --gray-alpha-700: light-dark(oklch(0 0 0 / 0.32), oklch(1 0 0 / 0.32));

  --surface-primary: var(--background-100);
  --surface-secondary: var(--background-200);
  --surface-contrast: oklch(0.205 0 0);
  --text-primary: var(--gray-1000);
  --text-secondary: var(--gray-900);
  --text-on-contrast: oklch(0.946 0 0);

  --border-subtle: var(--gray-alpha-300);
  --border-default: var(--gray-alpha-400);
  --border-strong: var(--gray-alpha-700);
  --focus: light-dark(oklch(0.596 0.196 256), oklch(0.72 0.15 250));

  --font-sans: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", "SFMono-Regular", Consolas, monospace;

  --type-title: 2rem;
  --type-section: 1.5rem;
  --type-subsection: 1.25rem;
  --type-lede: 1.125rem;
  --type-body: 1rem;
  --type-compact: 0.875rem;
  --type-label: 0.8125rem;
  --type-metadata: 0.8125rem;

  --weight-regular: 400;
  --weight-heading: 450;
  --weight-medium: 500;
  --weight-semibold: 600;

  --leading-body: 24px;
  --leading-compact: 20px;
  --leading-caption: 18px;
  --leading-title: 40px;
  --leading-section: 32px;
  --leading-subsection: 26px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Departure: this project pins radius to 3px. Vercel publishes 6px and 8px. */
  --radius: 3px;
  --control-height: 36px;
  --content-width: 1200px;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

body {
  margin: 0;
  background: var(--surface-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--type-body);
  line-height: var(--leading-body);
  font-weight: var(--weight-regular);
  font-variant-numeric: tabular-nums;
}

.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.meta { font-size: var(--type-metadata); line-height: var(--leading-caption); color: var(--text-secondary); }

:where(a, button, [tabindex]):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-radius: var(--radius);
}

.shell { max-width: var(--content-width); margin: 0 auto; padding-inline: var(--space-6); }

/* ---- Masthead ---------------------------------------------------------- */

.masthead { border-bottom: 1px solid var(--border-subtle); background: var(--surface-primary); }
.masthead-inner {
  display: flex; align-items: baseline; gap: var(--space-4);
  padding-block: var(--space-5) var(--space-4);
}
.wordmark {
  margin: 0; font-size: var(--type-subsection); line-height: var(--leading-subsection);
  font-weight: var(--weight-semibold); letter-spacing: -0.02em;
}
.masthead .meta { margin-left: auto; }

/* ---- Filters ----------------------------------------------------------- */

.filters {
  display: flex; flex-wrap: wrap; gap: var(--space-2);
  padding-block: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
.filter {
  display: inline-flex; align-items: center; gap: var(--space-2);
  height: 32px; padding-inline: var(--space-3);
  font: inherit; font-size: var(--type-label); font-weight: var(--weight-medium);
  color: var(--text-secondary); background: var(--surface-primary);
  border: 1px solid var(--border-default); border-radius: var(--radius);
  cursor: pointer; transition: color 120ms linear, border-color 120ms linear;
}
.filter:hover { color: var(--text-primary); border-color: var(--border-strong); }
.filter .n { font-family: var(--font-mono); font-size: var(--type-metadata); color: var(--gray-700); }
.filter[aria-pressed="true"] {
  background: var(--surface-contrast); border-color: var(--surface-contrast); color: var(--text-on-contrast);
}
.filter[aria-pressed="true"] .n { color: var(--text-on-contrast); opacity: 0.6; }

/* ---- Grid -------------------------------------------------------------- */

.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
  gap: var(--space-6); padding-block: var(--space-8) var(--space-16);
}

.card {
  display: flex; flex-direction: column;
  background: var(--surface-primary);
  border: 1px solid var(--border-default); border-radius: var(--radius);
  overflow: hidden; cursor: pointer;
  transition: border-color 120ms linear;
}
.card:hover { border-color: var(--border-strong); }
.card[data-state="pending"] { cursor: default; }

/* Absolute positioning, not height:100%. A full-page capture can be 1440x7000,
   and a percentage height against an aspect-ratio box lets it push the figure open. */
.card figure {
  position: relative; margin: 0; aspect-ratio: 4 / 3; overflow: hidden;
  background: var(--surface-secondary); border-bottom: 1px solid var(--border-subtle);
}
.card img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: top center; display: block;
}

/* Thumbnails crop so the grid stays scannable, so the full capture needs an
   affordance. Pattern borrowed from 21st.dev's Gallery Grid with Lightbox. */
.zoom {
  position: absolute; top: var(--space-2); right: var(--space-2);
  display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
  color: var(--text-on-contrast); background: oklch(0 0 0 / 0.62);
  border: 1px solid oklch(1 0 0 / 0.22); border-radius: var(--radius);
  cursor: pointer; opacity: 0; transition: opacity 120ms linear;
}
.zoom svg { width: 14px; height: 14px; }
.card:hover .zoom, .zoom:focus-visible { opacity: 1; }
.card[data-state="pending"] img { filter: grayscale(1); opacity: 0.45; }

.card-body { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); flex: 1; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.card-head h2 {
  margin: 0; font-size: var(--type-compact); line-height: var(--leading-compact);
  font-weight: var(--weight-semibold); letter-spacing: -0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-head .descriptor {
  flex: 0 1 auto; font-family: var(--font-mono); font-size: var(--type-metadata);
  color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.tags { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.tag {
  font-size: var(--type-metadata); line-height: var(--leading-caption);
  padding: 2px var(--space-2); color: var(--text-secondary);
  background: var(--surface-secondary);
  border: 1px solid var(--border-subtle); border-radius: var(--radius);
}

.card-foot {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
  margin-top: auto; padding-top: var(--space-3); border-top: 1px solid var(--border-subtle);
  font-size: var(--type-metadata); line-height: var(--leading-caption);
}
.card-foot .family { font-weight: var(--weight-medium); }
.card-foot .index { font-family: var(--font-mono); color: var(--gray-700); }

.empty {
  grid-column: 1 / -1; padding-block: var(--space-16);
  text-align: center; color: var(--text-secondary);
}
.empty code {
  display: inline-block; margin-top: var(--space-3);
  font-family: var(--font-mono); font-size: var(--type-compact);
  background: var(--surface-secondary); border: 1px solid var(--border-subtle);
  border-radius: var(--radius); padding: var(--space-2) var(--space-3);
}

/* ---- Detail ------------------------------------------------------------ */

dialog {
  padding: 0; border: none; background: transparent;
  width: min(920px, calc(100vw - var(--space-8)));
  color: var(--text-primary);
}
dialog::backdrop { background: light-dark(oklch(0.205 0 0 / 0.42), oklch(0 0 0 / 0.68)); }

.sheet {
  background: var(--surface-primary);
  border: 1px solid var(--border-default); border-radius: var(--radius);
  max-height: 88vh; overflow: auto;
}
.sheet-figure {
  position: relative; display: block; width: 100%; max-height: 34vh; overflow: hidden;
  padding: 0; border: none; border-bottom: 1px solid var(--border-default);
  background: var(--surface-secondary); cursor: zoom-in; font: inherit; color: inherit;
}
.sheet-figure img { width: 100%; display: block; }
.sheet-figure-hint {
  position: absolute; right: var(--space-3); bottom: var(--space-3);
  font-size: var(--type-metadata); font-weight: var(--weight-medium);
  color: oklch(0.946 0 0); background: oklch(0 0 0 / 0.66);
  border: 1px solid oklch(1 0 0 / 0.22); border-radius: var(--radius);
  padding: var(--space-1) var(--space-2);
}

.sheet-body { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-6); }
.sheet-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.sheet-head h2 {
  margin: 0; font-size: var(--type-section); line-height: var(--leading-section);
  font-weight: var(--weight-semibold); letter-spacing: -0.02em;
}
.sheet-head .descriptor { font-family: var(--font-mono); font-size: var(--type-label); color: var(--text-secondary); }
.thesis { margin: 0; max-width: 68ch; font-size: var(--type-lede); line-height: 28px; color: var(--text-secondary); }

.block { display: flex; flex-direction: column; gap: var(--space-3); }
/* Spacing comes from the flex gap, so default paragraph margins would double it. */
.block > p { margin: 0; }
.block-label {
  font-size: var(--type-metadata); line-height: var(--leading-caption);
  font-weight: var(--weight-medium); letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--gray-800);
}

pre {
  margin: 0; padding: var(--space-4);
  font-family: var(--font-mono); font-size: var(--type-label); line-height: 22px;
  color: var(--text-primary); background: var(--surface-secondary);
  border: 1px solid var(--border-subtle); border-radius: var(--radius);
  white-space: pre-wrap; word-break: break-word;
}
mark {
  background: var(--surface-contrast); color: var(--text-on-contrast);
  padding: 1px 5px; border-radius: var(--radius); font-weight: var(--weight-medium);
}

table { width: 100%; border-collapse: collapse; font-size: var(--type-label); }
caption { text-align: left; padding-bottom: var(--space-2); }
th, td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border-subtle); }
thead th {
  font-weight: var(--weight-medium); color: var(--text-secondary);
  border-bottom: 1px solid var(--border-default);
}
/* Vercel rule: text columns left, numeric columns right, headers follow their column. */
th, td { text-align: left; }
th.num, td.num { text-align: right; font-family: var(--font-mono); }
td.token { font-family: var(--font-mono); color: var(--text-secondary); }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: none; }

.swatch { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); }
.swatch i {
  width: 12px; height: 12px; display: block; border-radius: var(--radius);
  border: 1px solid var(--border-default);
}

.actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.button {
  display: inline-flex; align-items: center; justify-content: center;
  height: var(--control-height); padding-inline: var(--space-4);
  font: inherit; font-size: var(--type-label); font-weight: var(--weight-medium);
  color: var(--text-primary); background: var(--surface-primary); text-decoration: none;
  border: 1px solid var(--border-default); border-radius: var(--radius);
  cursor: pointer; transition: border-color 120ms linear, opacity 120ms linear;
}
.button:hover { border-color: var(--border-strong); }
.button[data-variant="primary"] {
  background: var(--surface-contrast); border-color: var(--surface-contrast); color: var(--text-on-contrast);
}
.button[data-variant="primary"]:hover { opacity: 0.9; }

/* ---- Lightbox ---------------------------------------------------------- */

#lightbox {
  width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh;
  border: none; background: transparent;
}
#lightbox::backdrop { background: light-dark(oklch(0.15 0 0 / 0.94), oklch(0 0 0 / 0.94)); }

.viewer { position: relative; display: grid; grid-template-rows: auto 1fr; height: 100dvh; color: oklch(0.946 0 0); }

.viewer-bar {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid oklch(1 0 0 / 0.14);
}
.viewer-title { font-size: var(--type-compact); font-weight: var(--weight-semibold); }
.viewer-sub { font-family: var(--font-mono); font-size: var(--type-metadata); color: oklch(0.72 0 0); }
.viewer-bar .spacer { margin-left: auto; }
.viewer-bar .button {
  height: 32px; color: oklch(0.946 0 0); background: transparent; border-color: oklch(1 0 0 / 0.22);
}
.viewer-bar .button:hover { border-color: oklch(1 0 0 / 0.44); }
.viewer-bar .button[aria-pressed="true"] {
  background: oklch(0.946 0 0); border-color: oklch(0.946 0 0); color: oklch(0.205 0 0);
}

/* Two honest ways to see a capture. "width" fills the frame and scrolls, which
   is how you read a full-page screenshot. "whole" fits every pixel on screen. */
/* min-height:0 is load-bearing. A 1fr grid row defaults to min-height:auto, so
   without it the stage grows to the image's natural height and max-height:100%
   on the image resolves against that, which defeats the whole-fit entirely. */
.viewer-stage { overflow: auto; padding: var(--space-4); min-height: 0; }
.viewer-stage img { display: block; }
.viewer-stage[data-fit="width"] img { width: 100%; max-width: 1400px; height: auto; margin-inline: auto; }
/* Absolute inset + object-fit, not max-height:100%. A percentage max-height on a
   grid item resolves against an auto-sized row, which is circular and silently
   does nothing. This letterboxes the whole capture no matter its proportions. */
.viewer-stage[data-fit="whole"] { position: relative; overflow: hidden; padding: 0; }
.viewer-stage[data-fit="whole"] img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  max-width: none; max-height: none;
  padding: var(--space-4); /* border-box, so this insets the picture without changing the box */
  object-fit: contain; object-position: center;
}

.viewer-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  display: grid; place-items: center; width: 40px; height: 40px; padding: 0;
  color: oklch(0.946 0 0); background: oklch(0 0 0 / 0.6);
  border: 1px solid oklch(1 0 0 / 0.22); border-radius: var(--radius);
  cursor: pointer; transition: border-color 120ms linear;
}
.viewer-nav:hover { border-color: oklch(1 0 0 / 0.5); }
.viewer-nav svg { width: 18px; height: 18px; }
.viewer-nav[data-dir="prev"] { left: var(--space-4); }
.viewer-nav[data-dir="next"] { right: var(--space-4); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 1ms !important; animation-duration: 1ms !important; }
}

@media (max-width: 640px) {
  .shell { padding-inline: var(--space-4); }
  .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-4); }
  .sheet-body { padding: var(--space-4); }
}
`;
