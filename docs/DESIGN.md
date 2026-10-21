# Design

The interface follows [vercel.com/design.md](https://vercel.com/design.md). Token values come from Vercel's published `vercel-brand.css` and live in `src/ui/theme.ts`.

## Doctrine

Precise, calm, direct, technically literate, evidence-led, restrained. Confidence comes from clarity and proof, not decoration.

The rejection list is load-bearing, quoted from the source:

> Hard reject decorative gradients, gradient text, glows, blobs, stripes, textures, grid backgrounds, glass effects, paper simulations, colored side rails, ornamental shadows, and fake depth.

Separation is carried by borders and space. The saved work supplies every bit of colour on the page; the chrome supplies none.

## Foundation

| | |
|---|---|
| Type | Geist Sans, bundled as a variable woff2 |
| Mono | Geist Mono, for ids, hex values, paths, spacing values, counters |
| Colour | Vercel's OKLCH gray ramp via `light-dark()`, no hue anywhere in the chrome |
| Radius | **3px** everywhere |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Type scale | 2rem / 1.5rem / 1.25rem / 1.125rem / 1rem / 0.875rem / 0.8125rem |
| Weights | 400 regular, 450 heading, 500 medium, 600 semibold |
| Controls | 36px tall buttons, 32px filter chips |
| Content | 1200px max, 68ch reading measure |

Two deliberate departures from the published sheet, both marked in `theme.ts`:

- **Radius is pinned to 3px.** Vercel publishes 6px and 8px. 3px was specified for this project and is applied consistently, which is what their guidance actually asks for.
- **The gray alpha ramp is derived.** The published sheet resolves borders through `--vbg-gray-alpha-*` variables it does not expose, so those three values are approximated to match.

## Rules the layout follows

- **Theming is implicit.** `color-scheme: light dark` plus `light-dark()` tokens. No switcher, no toggle. It follows the OS.
- **Tables carry the measured data.** Text columns and their headers align left, numeric columns and their headers align right. Colours are ranked by share of painted area, and the caption says so, because a number without its base is not evidence.
- **Metadata stays visible.** Keywords sit on the card rather than hiding behind a hover, so the grid can be read without interaction.
- **Motion is functional only.** 120ms linear border transitions, nothing else. No transforms, no staggered entrances, no pulsing. `prefers-reduced-motion` is honoured.
- **Every figure is tabular.** `font-variant-numeric: tabular-nums` globally, so counters and percentages align down a column.

## Changing it

`src/ui/theme.ts` is the only file with visual values in it. `src/ui/render.ts` is markup and `src/ui/client.ts` is behaviour; neither carries a colour or a size.
