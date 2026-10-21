/**
 * Reads real design tokens off a live page.
 *
 * This is the whole reason grain captures URLs differently from images: a
 * screenshot makes a model guess at the palette and the type, while the DOM
 * knows. Everything here is measured, never inferred.
 *
 * Loaded by both the Chrome extension (as a content script) and by Playwright
 * (injected via addScriptTag), so it must stay dependency-free plain JS and
 * must not assume any bundler.
 */
(() => {
  const MAX_ELEMENTS = 4000;

  function toHex(value) {
    if (!value) return null;
    const m = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/i);
    if (!m) return null;
    const a = m[4] === undefined ? 1 : Number(m[4]);
    if (a < 0.05) return null;
    const hex = [m[1], m[2], m[3]]
      .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
      .join("");
    return `#${hex}`;
  }

  function topBy(map, limit) {
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  function normalizeFont(stack) {
    if (!stack) return null;
    const first = stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (!first) return null;
    const generic = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"];
    return generic.includes(first.toLowerCase()) ? null : first;
  }

  function extract() {
    const elements = Array.from(document.querySelectorAll("*")).slice(0, MAX_ELEMENTS);

    const bgArea = new Map();
    const textWeight = new Map();
    const borderCount = new Map();
    const fontWeightByArea = new Map();
    const radii = new Map();
    const shadows = new Map();
    const spacing = new Map();
    const transitions = new Map();

    let totalArea = 0;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const area = Math.max(0, rect.width) * Math.max(0, rect.height);
      const style = getComputedStyle(el);

      if (style.display === "none" || style.visibility === "hidden") continue;

      const bg = toHex(style.backgroundColor);
      if (bg && area > 0) {
        bgArea.set(bg, (bgArea.get(bg) || 0) + area);
        totalArea += area;
      }

      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(" ");

      if (directText.length > 1) {
        const size = parseFloat(style.fontSize) || 16;
        const weight = directText.length * size;

        const color = toHex(style.color);
        if (color) textWeight.set(color, (textWeight.get(color) || 0) + weight);

        const font = normalizeFont(style.fontFamily);
        if (font) fontWeightByArea.set(font, (fontWeightByArea.get(font) || 0) + weight);
      }

      if (style.borderStyle !== "none" && parseFloat(style.borderTopWidth) > 0) {
        const bc = toHex(style.borderTopColor);
        if (bc) borderCount.set(bc, (borderCount.get(bc) || 0) + 1);
      }

      const radius = style.borderRadius;
      if (radius && radius !== "0px") radii.set(radius, (radii.get(radius) || 0) + 1);

      const shadow = style.boxShadow;
      if (shadow && shadow !== "none") shadows.set(shadow, (shadows.get(shadow) || 0) + 1);

      // Only keep transitions that actually have a duration. The computed
      // shorthand is often a bare "all", which tells you nothing.
      const transition = style.transition;
      if (transition && /[\d.]+m?s/.test(transition) && !/^all 0s/.test(transition)) {
        transitions.set(transition, (transitions.get(transition) || 0) + 1);
      }

      for (const prop of ["paddingTop", "paddingLeft", "marginTop", "gap"]) {
        const raw = style[prop];
        const n = parseFloat(raw);
        if (n > 0 && n <= 256) {
          const key = `${Math.round(n)}px`;
          spacing.set(key, (spacing.get(key) || 0) + 1);
        }
      }
    }

    const colors = [];
    for (const [hex, area] of topBy(bgArea, 8)) {
      colors.push({ hex, areaPct: Number(((area / (totalArea || 1)) * 100).toFixed(1)), role: "background" });
    }
    for (const [hex] of topBy(textWeight, 5)) {
      colors.push({ hex, areaPct: 0, role: "text" });
    }
    for (const [hex] of topBy(borderCount, 3)) {
      colors.push({ hex, areaPct: 0, role: "border" });
    }

    return {
      title: document.title || location.hostname,
      fonts: topBy(fontWeightByArea, 5).map(([f]) => f),
      colors,
      radii: topBy(radii, 6).map(([r]) => r),
      shadows: topBy(shadows, 5).map(([s]) => s),
      spacing: topBy(spacing, 10)
        .map(([s]) => s)
        .sort((a, b) => parseFloat(a) - parseFloat(b)),
      transitions: topBy(transitions, 5).map(([t]) => t),
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  }

  window.__grainExtractTokens = extract;
})();
