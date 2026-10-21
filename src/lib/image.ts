import { execFile } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { MAX_IMAGE_EDGE } from "./config.ts";

const run = promisify(execFile);

export interface ModelImage {
  data: string;
  mediaType: string;
  label: string;
}

export function mediaTypeFor(file: string): string {
  switch (extname(file).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/png";
  }
}

async function probe(path: string): Promise<{ w: number; h: number } | null> {
  try {
    const { stdout } = await run("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0",
      path,
    ]);
    const [w, h] = stdout.trim().split(",").map(Number);
    return w && h ? { w, h } : null;
  } catch {
    return null;
  }
}

async function transform(path: string, filter: string, tag: string): Promise<string | null> {
  const out = join(tmpdir(), `grain-${tag}-${Date.now()}-${Math.round(performance.now())}.png`);
  try {
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", path, "-vf", filter, "-y", out]);
    return out;
  } catch {
    return null;
  }
}

function encode(path: string, label: string): ModelImage {
  return { data: readFileSync(path).toString("base64"), mediaType: mediaTypeFor(path), label };
}

/**
 * Turn a saved asset into the image blocks sent to the model.
 *
 * Full-page captures are routinely 1280x9000. Scaling one of those to fit the
 * model's long edge makes the type illegible, which is the information we most
 * want, so tall captures are sent twice: a legible crop of the top viewport for
 * detail, and a downscaled whole-page view for structure. Without ffmpeg this
 * falls back to sending the original file.
 */
export async function prepare(path: string): Promise<ModelImage[]> {
  const dims = await probe(path);
  if (!dims) return [encode(path, "the design")];

  const { w, h } = dims;
  const tall = h > w * 2;
  const oversized = Math.max(w, h) > MAX_IMAGE_EDGE;
  if (!tall && !oversized) return [encode(path, "the design")];

  const temps: string[] = [];
  const images: ModelImage[] = [];

  try {
    if (tall) {
      const cropHeight = Math.min(h, Math.round(w * 0.72));
      const heroScale = w > MAX_IMAGE_EDGE ? `,scale=${MAX_IMAGE_EDGE}:-2` : "";
      const hero = await transform(path, `crop=${w}:${cropHeight}:0:0${heroScale}`, "hero");
      if (hero) {
        temps.push(hero);
        images.push(encode(hero, "the top of the page, at full detail"));
      }
    }

    const fit = `scale='if(gt(iw,ih),min(${MAX_IMAGE_EDGE},iw),-2)':'if(gt(iw,ih),-2,min(${MAX_IMAGE_EDGE},ih))'`;
    const full = await transform(path, fit, "full");
    if (full) {
      temps.push(full);
      images.push(encode(full, tall ? "the whole page, scaled down" : "the design"));
    }

    return images.length ? images : [encode(path, "the design")];
  } finally {
    for (const temp of temps) {
      try {
        unlinkSync(temp);
      } catch {
        /* best effort */
      }
    }
  }
}
