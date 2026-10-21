import { writeFileSync } from "node:fs";
import { ensureLibrary, readLibrary, syncFonts } from "../core/store.ts";
import { paths } from "../lib/config.ts";
import { renderPage } from "../ui/render.ts";

/** Render the library to a single self-contained page. */
export function build(): string {
  ensureLibrary();
  syncFonts();
  writeFileSync(paths.page, renderPage(readLibrary()));
  return paths.page;
}
