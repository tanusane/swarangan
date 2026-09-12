/**
 * Derive brand variants from the supplied logo.
 *
 * Produces two things the originals do not give us:
 *
 *   mark.png          the tree, songbird and note on their own — favicon, the
 *                     Swarangan.AI avatar, and anywhere the wordmark is too wide
 *   logo-reverse.png  the logo for dark grounds, with the deep-blue wordmark
 *                     recoloured to ivory and the magenta left alone
 *
 * The reverse is a real two-colour reversal rather than a CSS `invert`, which
 * would flatten the whole brand into a single white silhouette.
 *
 * Both come out already transparent, because the reversed wordmark is itself
 * near-ivory — running background removal afterwards would erase it.
 *
 * Outputs land in brand-derived/ and are picked up as sources by
 * scripts/build-assets.mjs. Run via `npm run assets`.
 */
import { mkdirSync } from "node:fs";

import { fromRgba, removeFlatBackground } from "./lib/image-ops.mjs";

const SRC = "Swarangan-Logo/SwaranganLogo.PNG";
const OUT = "brand-derived";

/** Ivory the blue wordmark becomes on a dark ground (sand-50). */
const REVERSE_INK = [253, 251, 247];

mkdirSync(OUT, { recursive: true });

// Start from the logo with its white studio background already knocked out.
const { data, width, height } = await removeFlatBackground(SRC);

const at = (x, y) => {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};
const isMagenta = ([r, g, b, a]) => a >= 200 && r > 90 && r - g > 45 && b < r;
const isBlue = ([r, g, b, a]) => a >= 200 && b > 90 && b - r > 45 && b - g > 30;

// ---- 1. The mark -----------------------------------------------------------
// The trunk descends through the wordmark, so the raw magenta bounding box would
// sweep up blue letters. Find where the wordmark begins and crop above it.
let wordmarkTop = height;
for (let y = 0; y < height && wordmarkTop === height; y++) {
  let run = 0;
  for (let x = 0; x < width; x++) {
    // A few stray blue pixels are antialiasing; a real glyph row has many.
    if (isBlue(at(x, y)) && ++run > 12) {
      wordmarkTop = y;
      break;
    }
  }
}

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < wordmarkTop; y++) {
  for (let x = 0; x < width; x++) {
    if (!isMagenta(at(x, y))) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

const PAD = 8;
const left = Math.max(0, minX - PAD);
const top = Math.max(0, minY - PAD);
const cropW = Math.min(width - left, maxX - minX + PAD * 2);
const cropH = Math.min(height - top, maxY - minY + PAD * 2);
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

await fromRgba({ data, width, height })
  .extract({ left, top, width: cropW, height: cropH })
  // `contain` pads to exactly 512x512 on a transparent field, centring the
  // artwork, so the mark drops cleanly into any circular avatar. (Note sharp
  // applies `extend` after `resize` regardless of chain order, which is why
  // squaring is done here rather than with an extend.)
  .resize(512, 512, { fit: "contain", background: transparent })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/mark.png`);

// ---- 2. The reverse --------------------------------------------------------
// Recolour blue pixels towards ivory, keeping each pixel's own alpha so
// antialiased glyph edges stay smooth. Magenta is untouched.
const reverse = Buffer.from(data);
for (let i = 0; i < reverse.length; i += 4) {
  if (reverse[i + 3] === 0) continue;
  const [r, g, b] = [reverse[i], reverse[i + 1], reverse[i + 2]];
  if (!(b > 60 && b - r > 30 && b - g > 18)) continue;

  // How strongly this pixel reads as the wordmark blue, 0..1.
  const coverage = Math.min(1, (b - r) / 120);
  for (let c = 0; c < 3; c++) {
    reverse[i + c] = Math.round(
      reverse[i + c] * (1 - coverage) + REVERSE_INK[c] * coverage,
    );
  }
}

await fromRgba({ data: reverse, width, height })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/logo-reverse.png`);

console.log(`brand: wordmark begins at y=${wordmarkTop}`);
console.log(`brand: mark cropped from x:${minX}..${maxX} y:${minY}..${maxY}`);
console.log(`brand: wrote ${OUT}/mark.png and ${OUT}/logo-reverse.png`);
