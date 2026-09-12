/**
 * Shared image operations used by the brand and asset build scripts.
 *
 * Lives in one place because both scripts need to knock the flat studio
 * background out of a logo, and two copies of this thresholding would drift.
 */
import sharp from "sharp";

/** A pixel this far off neutral is artwork, whatever its brightness. */
const SATURATION_TOLERANCE = 26;

/**
 * How far a neutral pixel may sit from the sampled background colour and still
 * count as background.
 *
 * Generous on purpose: the supplied logo's outermost column is 235,239,239
 * rather than pure white, and a tight tolerance leaves that as a semi-opaque
 * line — a faint frame around the artwork, visible on the dark hero. Being
 * generous is safe here *because* the fill is seeded from the border (see
 * below), so a light pixel is only removed if it is actually connected to the
 * outside.
 */
const BACKGROUND_TOLERANCE = 70;

/** Beyond this distance from the background, a boundary pixel is fully artwork. */
const FULLY_ARTWORK = 45;
/** Within this distance, a boundary pixel is fully background. */
const FULLY_BACKGROUND = 9;

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const isNeutral = ([r, g, b]) =>
  Math.max(r, g, b) - Math.min(r, g, b) <= SATURATION_TOLERANCE;

/**
 * Knock a flat background out of a logo, returning `{ data, width, height }`
 * as straight RGBA.
 *
 * The supplied Swarangan logos are flattened onto an opaque background — white
 * for the wordmark, black for the Suro Bharati emblem — which makes them
 * unusable over a photograph or a coloured card.
 *
 * This is a FLOOD FILL seeded from the image border, not a global threshold,
 * and that distinction matters twice over:
 *
 *   1. The logo has interior light details — the white veins inside each leaf,
 *      and the songbird's eye. A global "remove light pixels" pass punches
 *      those out into transparent holes, which looks fine on an ivory page and
 *      obviously broken on the dark blue hero. A flood fill cannot reach them,
 *      so they survive.
 *   2. It lets the tolerance be generous enough to swallow the slightly
 *      off-white border the source actually has, without that generosity
 *      endangering anything enclosed by the artwork.
 *
 * Boundary pixels are then feathered proportionally, so curves stay smooth
 * rather than going jagged.
 *
 * If the corners disagree, or are not a near-white/near-black neutral, the
 * pixels are returned untouched — so a photograph passed through here is safe.
 */
export async function removeFlatBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const rgbAt = (index) => [data[index], data[index + 1], data[index + 2]];

  const corners = [
    rgbAt(0),
    rgbAt((width - 1) * 4),
    rgbAt((height - 1) * width * 4),
    rgbAt(((height - 1) * width + width - 1) * 4),
  ];

  const allNeutral = corners.every(isNeutral);
  const light = allNeutral && corners.every((c) => luminance(c) > 200);
  const dark = allNeutral && corners.every((c) => luminance(c) < 55);
  if (!light && !dark) return { data, width, height, changed: false };

  /** Distance from the background colour: 0 = background, 255 = its opposite. */
  const distanceFromBackground = (pixel) =>
    light ? 255 - Math.min(...pixel) : Math.max(...pixel);

  const isBackgroundish = (pixel) =>
    isNeutral(pixel) && distanceFromBackground(pixel) <= BACKGROUND_TOLERANCE;

  // ---- Flood fill from every border pixel ---------------------------------
  const filled = new Uint8Array(width * height);
  const stack = [];

  const seed = (x, y) => {
    const p = y * width + x;
    if (filled[p] || !isBackgroundish(rgbAt(p * 4))) return;
    filled[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;

    if (x > 0) seed(x - 1, y);
    if (x < width - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < height - 1) seed(x, y + 1);
  }

  // ---- Apply transparency, feathering the boundary ------------------------
  let cleared = 0;

  for (let p = 0; p < filled.length; p++) {
    const i = p * 4;

    if (filled[p]) {
      data[i + 3] = 0;
      cleared++;
      continue;
    }

    // Not background, but sitting on the boundary of it: soften proportionally
    // so the edge of the artwork is not a hard staircase.
    const x = p % width;
    const y = (p - x) / width;
    const touchesBackground =
      (x > 0 && filled[p - 1]) ||
      (x < width - 1 && filled[p + 1]) ||
      (y > 0 && filled[p - width]) ||
      (y < height - 1 && filled[p + width]);
    if (!touchesBackground) continue;

    const distance = distanceFromBackground(rgbAt(i));
    if (distance >= FULLY_ARTWORK) continue;

    data[i + 3] =
      distance <= FULLY_BACKGROUND
        ? 0
        : Math.round(
            ((distance - FULLY_BACKGROUND) /
              (FULLY_ARTWORK - FULLY_BACKGROUND)) *
              data[i + 3],
          );
  }

  return { data, width, height, changed: true, cleared };
}

/** Wrap a raw RGBA result from `removeFlatBackground` back into a sharp pipeline. */
export function fromRgba({ data, width, height }) {
  return sharp(data, { raw: { width, height, channels: 4 } });
}
