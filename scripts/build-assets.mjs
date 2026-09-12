/**
 * Asset pipeline.
 *
 * Takes the originals (the logo, the photos rescued from the legacy HostGator
 * site, and the high-resolution event photos supplied by Amit) and produces the
 * optimised, correctly-named set the app ships, plus a generated manifest of
 * intrinsic dimensions and blur placeholders.
 *
 * Why a manifest: every <SwarImage> needs width/height to avoid layout shift and
 * a tiny blurDataURL to avoid a flash of empty space. Measuring at build time
 * means no component ever hard-codes a dimension, and swapping a photo is a
 * re-run of this script rather than an edit in six files.
 *
 * Run:  npm run assets
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

import { fromRgba, removeFlatBackground } from "./lib/image-ops.mjs";

const OUT_DIR = "public/images";
const MANIFEST = "src/content/generated/image-manifest.ts";

/** Longest edge we ever serve. Beyond this is wasted bytes for a brochure site. */
const MAX_EDGE = 2400;
/** Quality per format. 82 is the point where JPEG artefacts stop being visible. */
const JPEG_Q = 82;

/**
 * source        -> file on disk to read
 * out           -> path under public/ (extension decides the encoder)
 * alt           -> shipped alt text; the manifest carries it so it can never
 *                  be forgotten at the call site
 * fit           -> "contain" keeps logos intact; photos are left unpadded
 */
const ASSETS = [
  {
    source: "Swarangan-Logo/SwaranganLogo.PNG",
    out: "brand/logo.png",
    alt: "Swarangan — a songbird singing in a tree, beside the Swarangan wordmark",
    maxEdge: 1200,
    dropBackground: true,
  },
  {
    // Derived by scripts/build-brand.mjs — already transparent.
    source: "brand-derived/mark.png",
    out: "brand/mark.png",
    alt: "The Swarangan tree and songbird mark",
    maxEdge: 512,
  },
  {
    // Derived by scripts/build-brand.mjs — the wordmark reversed to ivory for
    // dark grounds. Already transparent, and must NOT be background-stripped.
    source: "brand-derived/logo-reverse.png",
    out: "brand/logo-reverse.png",
    alt: "Swarangan — a songbird singing in a tree, beside the Swarangan wordmark",
    maxEdge: 1200,
  },
  {
    source: "assets-source/legacy/home-2.jpg",
    out: "people/tanuja-sane-tanpura.jpg",
    alt: "Tanuja Sane seated with her tanpura, smiling towards the camera",
  },
  {
    source: "assets-source/legacy/home-4.jpg",
    out: "affiliations/bharati-vidyapeeth.jpg",
    alt: "Bharati Vidyapeeth (Deemed to be University), Pune — School of Performing Arts",
    maxEdge: 1022,
  },
  {
    source: "assets-source/legacy/home-3.png",
    out: "affiliations/suro-bharati.png",
    alt: "Suro Bharati Sangeet Kala Kendra emblem",
    maxEdge: 450,
    dropBackground: true,
  },
  {
    source: "assets-source/legacy/home-1.jpg",
    out: "instruments/tanpura-and-tabla.jpg",
    alt: "A tanpura resting beside a pair of tabla",
    maxEdge: 550,
  },

  // -- Concert photographs supplied by Amit ----------------------------------
  {
    source: "important-photos/guru-purnima.jpeg",
    out: "people/tanuja-sane-guru-paurnima.jpg",
    alt: "Tanuja Sane singing with her tanpura at a Guru Paurnima concert, in a green and gold saree",
  },
  {
    source: "important-photos/guru-vandana.jpeg",
    out: "events/guru-vandana-1.jpg",
    alt: "Tanuja Sane performing at Guru Vandana, seated with her tanpura and accompanied by tabla and harmonium",
  },
  {
    source: "important-photos/guru-vandana-2.jpeg",
    out: "events/guru-vandana-2.jpg",
    alt: "Tanuja Sane mid-phrase at Guru Vandana, hand raised to shape the note",
  },

  // -- Annual function 2026: "Thumri Se Ghazal Tak" --------------------------
  {
    source: "important-photos/WhatsApp Image 2026-09-12 at 11.03.10 AM.jpeg",
    out: "events/af2026-thumri-se-ghazal-tak.jpg",
    alt: "Swarangan's 2026 annual function, Thumri Se Ghazal Tak: three vocalists on stage with tabla and harmonium accompaniment",
  },

  // -- Annual function 2024 --------------------------------------------------
  {
    source: "important-photos/WhatsApp Image 2026-09-12 at 11.03.45 AM.jpeg",
    out: "events/af2024-young-students.jpg",
    alt: "Young Swarangan students singing together on stage at the 2024 annual function, accompanied by tabla and harmonium",
  },
  {
    source: "important-photos/WhatsApp Image 2026-09-12 at 11.04.06 AM.jpeg",
    out: "events/af2024-ensemble.jpg",
    alt: "Students and teachers performing on a garlanded stage at Swarangan's 2024 annual function",
  },
  {
    source: "important-photos/WhatsApp Image 2026-09-12 at 11.03.35 AM.jpeg",
    out: "events/af2024-auditorium.jpg",
    alt: "A full auditorium watching the 2024 Swarangan annual function, with a compere introducing the next item",
  },

  // -- Annual function 2022 (rescued from the legacy site) -------------------
  {
    source: "assets-source/legacy/af2022-1.jpg",
    out: "events/af2022-1.jpg",
    alt: "Swarangan students performing at the 2022 annual function",
  },
  {
    source: "assets-source/legacy/af2022-2.jpg",
    out: "events/af2022-2.jpg",
    alt: "Swarangan students on stage at the 2022 annual function",
  },
  {
    source: "assets-source/legacy/af2022-3.jpg",
    out: "events/af2022-3.jpg",
    alt: "A group performance at Swarangan's 2022 annual function",
  },
  {
    source: "assets-source/legacy/af2022-4.jpg",
    out: "events/af2022-4.jpg",
    alt: "Performers and accompanists at Swarangan's 2022 annual function",
  },
];

/** Tiny, heavily-blurred inline preview used as the Next.js blurDataURL. */
async function blurPlaceholder(input) {
  const buf = await sharp(input)
    .flatten({ background: "#fdfbf7" })
    .resize(16, 16, { fit: "inside" })
    .blur(1.2)
    .webp({ quality: 35 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

const entries = [];
let failed = 0;

for (const asset of ASSETS) {
  if (!existsSync(asset.source)) {
    console.error(`MISSING  ${asset.source}`);
    failed++;
    continue;
  }

  const outPath = `${OUT_DIR}/${asset.out}`;
  mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });

  const limit = asset.maxEdge ?? MAX_EDGE;
  const isPng = asset.out.endsWith(".png");

  const base = asset.dropBackground
    ? fromRgba(await removeFlatBackground(asset.source))
    : sharp(asset.source).rotate();

  let pipeline = base.resize({
    width: limit,
    height: limit,
    fit: "inside",
    withoutEnlargement: true,
  });
  pipeline = isPng
    ? // A palette cannot hold a feathered alpha edge, so keep full colour here.
      pipeline.png({ compressionLevel: 9, palette: !asset.dropBackground })
    : pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true, progressive: true });

  const info = await pipeline.toFile(outPath);
  const blurDataURL = await blurPlaceholder(outPath);

  entries.push({
    key: asset.out,
    src: `/images/${asset.out}`,
    width: info.width,
    height: info.height,
    alt: asset.alt,
    blurDataURL,
  });

  console.log(
    `${asset.out.padEnd(42)} ${String(info.width).padStart(4)}x${String(info.height).padEnd(4)}  ${(info.size / 1024).toFixed(0)} kB`,
  );
}

// ---- Emit the manifest ------------------------------------------------------
mkdirSync(MANIFEST.slice(0, MANIFEST.lastIndexOf("/")), { recursive: true });

const body = entries
  .map(
    (e) => `  ${JSON.stringify(e.key)}: {
    src: ${JSON.stringify(e.src)},
    width: ${e.width},
    height: ${e.height},
    alt: ${JSON.stringify(e.alt)},
    blurDataURL:
      ${JSON.stringify(e.blurDataURL)},
  },`,
  )
  .join("\n");

writeFileSync(
  MANIFEST,
  `// GENERATED by scripts/build-assets.mjs — do not edit by hand.
// Run \`npm run assets\` after adding or replacing an image.

export interface ManifestImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly blurDataURL: string;
}

export const imageManifest = {
${body}
} as const satisfies Record<string, ManifestImage>;

export type ImageKey = keyof typeof imageManifest;
`,
  "utf8",
);

console.log(`\n${entries.length} assets -> ${MANIFEST}`);
if (failed) {
  console.error(`${failed} source file(s) missing.`);
  process.exit(1);
}
