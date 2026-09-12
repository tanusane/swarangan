/**
 * Generate the Swarangan colour ramps from the two seed colours sampled out of the
 * logo, and verify every text/background pair we intend to ship meets WCAG AA.
 * Run:  node scripts/build-palette.mjs
 */

// ---- sRGB <-> OKLCH ----------------------------------------------------------
const srgbToLin = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const linToSrgb = (c) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

function rgbToOklch([r, g, b]) {
  const [R, G, B] = [r, g, b].map((v) => srgbToLin(v / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, Bb), (Math.atan2(Bb, A) * 180) / Math.PI];
}

function oklchToRgb([L, C, hDeg]) {
  const h = (hDeg * Math.PI) / 180;
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const Bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [R, G, Bl].map((v) =>
    Math.max(0, Math.min(255, Math.round(linToSrgb(v) * 255))),
  );
}

const hex = ([r, g, b]) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// ---- WCAG contrast ----------------------------------------------------------
const relLum = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map((v) => srgbToLin(v / 255));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrast = (a, b) => {
  const [x, y] = [relLum(parseHex(a)), relLum(parseHex(b))].sort(
    (p, q) => q - p,
  );
  return (x + 0.05) / (y + 0.05);
};

// ---- Ramps ------------------------------------------------------------------
// Lightness targets for steps 50..950, tuned so 600 lands on the seed colour.
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LTARGET = [
  0.971, 0.936, 0.885, 0.808, 0.704, 0.588, 0.478, 0.408, 0.352, 0.301, 0.221,
];
// Chroma is scaled down at the pale and very dark ends so tints stay believable.
const CSCALE = [0.1, 0.19, 0.36, 0.56, 0.78, 0.95, 1.0, 0.95, 0.86, 0.75, 0.58];

function ramp(seedHex) {
  const [L, C, h] = rgbToOklch(parseHex(seedHex));
  // Anchor the seed at whichever step its own lightness actually belongs to, so the
  // ramp stays monotonic. Forcing every seed to 600 breaks light seeds like the gold.
  const seedIdx = LTARGET.reduce(
    (best, t, i) => (Math.abs(t - L) < Math.abs(LTARGET[best] - L) ? i : best),
    0,
  );
  const out = {};
  STEPS.forEach((step, i) => {
    out[step] =
      i === seedIdx
        ? seedHex.toUpperCase()
        : hex(oklchToRgb([LTARGET[i], C * CSCALE[i], h]));
  });
  out.anchor = STEPS[seedIdx];
  return out;
}

const SEED = { magenta: "#A02F6C", blue: "#054B96" };
const ramps = Object.fromEntries(
  Object.entries(SEED).map(([k, v]) => [k, ramp(v)]),
);

// Warm neutrals, hand-set: ivory page ground through to near-black ink.
ramps.sand = {
  50: "#FDFBF7",
  100: "#FAF6EF",
  200: "#F2E9DD",
  300: "#E6D9C7",
  400: "#D3C0A6",
  500: "#B99F7E",
  600: "#9C7F5E",
  700: "#7C6348",
  800: "#5C4936",
  900: "#3D3024",
  950: "#221B14",
};
ramps.gold = ramp("#C9A227");

for (const [name, r] of Object.entries(ramps)) {
  console.log(`\n${name}`);
  console.log(
    STEPS.map((s) => `  ${String(s).padStart(3)} ${r[s]}`).join("\n"),
  );
}

// ---- Contrast gate ----------------------------------------------------------
const PAIRS = [
  ["body text", ramps.sand[950], ramps.sand[50]],
  ["heading on ivory", ramps.blue[800], ramps.sand[50]],
  ["heading on sand", ramps.blue[800], ramps.sand[200]],
  ["link on ivory", ramps.magenta[700], ramps.sand[50]],
  ["link on sand", ramps.magenta[700], ramps.sand[200]],
  ["muted on ivory", ramps.sand[800], ramps.sand[50]],
  ["btn text on magenta", "#FFFFFF", ramps.magenta[600]],
  ["btn text on blue", "#FFFFFF", ramps.blue[600]],
  ["ivory on blue-950", ramps.sand[50], ramps.blue[950]],
  ["gold on blue-950", ramps.gold[300], ramps.blue[950]],
];

console.log("\nWCAG AA  (normal text needs 4.5, large needs 3.0)");
let fails = 0;
for (const [label, fg, bg] of PAIRS) {
  const r = contrast(fg, bg);
  const ok = r >= 4.5;
  if (!ok) fails++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  ${label.padEnd(21)} ${fg} on ${bg}`,
  );
}
console.log(fails ? `\n${fails} pair(s) below AA` : "\nAll pairs meet AA.");
process.exit(fails ? 1 : 0);
