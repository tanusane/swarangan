/**
 * Build the tanpura cursors.
 *
 * Tanuja is photographed with a tanpura in every picture of her on the site, and
 * it is the drone instrument a Hindustani vocalist practises and performs with,
 * so it is the cursor.
 *
 * Rendered to PNG rather than used as SVG because Safari does not reliably
 * accept SVG cursor images. Each is produced at 1x (32px, the size browsers
 * reliably honour for cursors) and 2x (64px) for high-density screens.
 *
 * The tip of the tanpura's neck sits at the top-left, exactly where a normal
 * arrow's tip would be, so clicking lands where the eye expects. A white halo
 * keeps it visible on both the ivory pages and the deep-blue sections.
 *
 * Run via `npm run assets`.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "public/cursors";
mkdirSync(OUT, { recursive: true });

/** Hotspot, in 1x pixels. Written into globals.css as well. */
export const HOTSPOT = [3, 3];

function tanpura({ neck, gourd, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <g stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- White halo so the cursor reads on light and dark grounds alike -->
    <path d="M3.4 3.4 L19.5 19.5" stroke="#ffffff" stroke-width="5.6"/>
    <circle cx="23" cy="23" r="7.2" fill="#ffffff" stroke="#ffffff" stroke-width="2.4"/>
    <path d="M6 9.4 L8.2 11.6 M9.4 6 L11.6 8.2" stroke="#ffffff" stroke-width="4"/>

    <!-- Tuning pegs near the head of the neck -->
    <path d="M6 9.4 L8.2 11.6 M9.4 6 L11.6 8.2" stroke="${accent}" stroke-width="1.8"/>
    <!-- The long neck, ending in a fine tip at the hotspot -->
    <path d="M3.4 3.4 L19.5 19.5" stroke="${neck}" stroke-width="3.2"/>
    <!-- The gourd resonator -->
    <circle cx="23" cy="23" r="6.6" fill="${gourd}"/>
    <!-- Bridge and strings across the gourd -->
    <path d="M20.2 25.8 L25.8 20.2" stroke="${accent}" stroke-width="1.4"/>
    <path d="M5.6 5.6 L21.6 21.6" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.6"/>
  </g>
</svg>`;
}

const VARIANTS = {
  // Everyday: the deep blue of the wordmark, with the magenta of the tree.
  tanpura: { neck: "#003977", gourd: "#a02f6c", accent: "#c9a227" },
  // Over something clickable: warmer, so it still signals "this is a link".
  "tanpura-pointer": { neck: "#a02f6c", gourd: "#c9a227", accent: "#003977" },
};

for (const [name, colours] of Object.entries(VARIANTS)) {
  const svg = Buffer.from(tanpura(colours));
  for (const [suffix, size] of [
    ["", 32],
    ["@2x", 64],
  ]) {
    await sharp(svg, { density: 72 * (size / 32) })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(`${OUT}/${name}${suffix}.png`);
  }
  console.log(`cursor: ${name} (32px, 64px)`);
}
