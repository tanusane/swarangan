/** Sample the dominant non-neutral colours from the Swarangan logo to seed the palette. */
import sharp from "sharp";

const SRC = "Swarangan-Logo/SwaranganLogo.PNG";
const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const buckets = new Map();
for (let i = 0; i < data.length; i += info.channels) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
  if (a < 200) continue;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 40 || max < 30 || min > 225) continue; // skip greys/white/black
  const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
  const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
  e.n++;
  e.r += r;
  e.g += g;
  e.b += b;
  buckets.set(key, e);
}

const hex = (n) => n.toString(16).padStart(2, "0");
[...buckets.values()]
  .sort((a, b) => b.n - a.n)
  .slice(0, 8)
  .forEach((e) => {
    const [r, g, b] = [e.r / e.n, e.g / e.n, e.b / e.n].map((v) =>
      Math.round(v),
    );
    console.log(
      `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase(),
      `rgb(${r},${g},${b})`,
      `${e.n} px`,
    );
  });
