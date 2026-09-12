/**
 * Shared image operations used by the brand and asset build scripts.
 *
 * Lives in one place because both scripts need to knock the flat studio
 * background out of a logo, and two copies of this thresholding would drift.
 */
import sharp from "sharp";

/** A pixel this far off neutral is artwork, whatever its brightness. */
const SATURATION_TOLERANCE = 26;
/** Beyond this distance from the background colour, a pixel is fully artwork. */
const FULLY_ARTWORK = 45;
/** Within this distance, a pixel is fully background. */
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
 * unusable over a photograph or a coloured card. The background colour is
 * detected from the corners rather than assumed, and edge pixels are feathered
 * proportionally so curves stay smooth instead of going jagged.
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
  const corner = (x, y) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const corners = [
    corner(0, 0),
    corner(width - 1, 0),
    corner(0, height - 1),
    corner(width - 1, height - 1),
  ];

  const light =
    corners.every(isNeutral) && corners.every((c) => luminance(c) > 200);
  const dark =
    corners.every(isNeutral) && corners.every((c) => luminance(c) < 55);

  if (!light && !dark) return { data, width, height, changed: false };

  for (let i = 0; i < data.length; i += 4) {
    const pixel = [data[i], data[i + 1], data[i + 2]];
    if (!isNeutral(pixel)) continue;

    const distance = light ? 255 - Math.min(...pixel) : Math.max(...pixel);
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

  return { data, width, height, changed: true };
}

/** Wrap a raw RGBA result from `removeFlatBackground` back into a sharp pipeline. */
export function fromRgba({ data, width, height }) {
  return sharp(data, { raw: { width, height, channels: 4 } });
}
