/** One saved reference. Persisted to `library/items/<id>.json`. */
export interface Item {
  id: string;
  /** `site` was captured from a live URL and carries measured tokens. `image` is a file. */
  kind: "site" | "image";
  source: string;
  capturedAt: string;
  /** Filename inside `library/assets/`. */
  asset: string;
  /** `pending` until the vision pass runs. Capture is instant; extraction is queued. */
  status: "pending" | "ready" | "failed";
  error?: string;
  /** Read off the live DOM. Present only for `kind: "site"`. Measured, never inferred. */
  tokens?: SiteTokens;
  /** Produced by the vision pass. */
  extract?: Extract;
  /** Assigned by the clustering pass, which always runs over the whole library. */
  family?: string;
}

export interface SiteTokens {
  title: string;
  fonts: string[];
  colors: ColorToken[];
  radii: string[];
  shadows: string[];
  spacing: string[];
  transitions: string[];
  viewport: { width: number; height: number };
}

export interface ColorToken {
  hex: string;
  /** Share of the painted area. Zero for text and border roles. */
  areaPct: number;
  role: "background" | "text" | "border";
}

export interface Extract {
  name: string;
  /** The card subtitle, in the form "a x b". */
  descriptor: string;
  /** One sentence on the mechanism that makes it work. */
  thesis: string;
  keywords: string[];
  /** The item's own guess at a family. The clustering pass may override it. */
  aesthetic: string;
  composition: Composition;
  typeNotes: string[];
  colorNotes: string[];
  motionNotes: string[];
  /** Reusable image prompt. Always contains the literal token `[SUBJECT]`. */
  imageRecipe: string;
  /** A pasteable paragraph describing this as a direction to build toward. */
  brief: string;
}

export interface Composition {
  archetype: string;
  hero: string;
  negativeSpace: string;
  grid: string;
}

export interface Family {
  name: string;
  note: string;
  itemIds: string[];
}

export interface Library {
  items: Item[];
  families: Family[];
}
