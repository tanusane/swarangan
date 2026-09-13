import {
  imageManifest,
  type ImageKey,
} from "@/content/generated/image-manifest";

/**
 * Media slots: every named image position on the site that an admin can
 * replace, e.g. the teacher's portrait in the About section.
 *
 * The registry below is the single list of slots. The admin "Images" page is
 * generated from it, and every page reads its images through it, so adding a
 * replaceable image anywhere is one entry here plus one <SlotImage> — no new
 * admin screen, no new table.
 *
 * Every slot has a FALLBACK that ships with the site. Until someone uploads a
 * replacement — or if Supabase is unreachable, or not set up yet — the fallback
 * is shown. A slot can therefore never render as a broken image.
 */

export interface SlotDefinition {
  /** Shown on the admin Images page. */
  label: string;
  /** Where it appears, so the admin knows what they are replacing. */
  where: string;
  /** The committed image used until a replacement is uploaded. */
  fallback: ImageKey;
  /** Width / height the slot is displayed at. Uploads are cropped to fit. */
  aspect: number;
}

export const MEDIA_SLOTS = {
  "home.teacher.portrait": {
    label: "Tanuja's portrait",
    where: "Home page — the “Your teacher” section",
    fallback: "people/tanuja-sane-tanpura.jpg",
    aspect: 4 / 5,
  },
} as const satisfies Record<string, SlotDefinition>;

export type SlotKey = keyof typeof MEDIA_SLOTS;

export function isSlotKey(value: string): value is SlotKey {
  return Object.hasOwn(MEDIA_SLOTS, value);
}

/** A row from the media_slots table. */
export interface SlotRow {
  key: string;
  storage_path: string;
  alt: string;
  focal_x: number;
  focal_y: number;
}

/** Everything a page needs to render a slot, whichever source it came from. */
export interface ResolvedSlot {
  src: string;
  alt: string;
  /** CSS object-position, from the admin's chosen focal point. */
  objectPosition: string;
  /** Only committed fallbacks have a build-time blur placeholder. */
  blurDataURL: string | null;
  /** True when showing the uploaded replacement rather than the fallback. */
  replaced: boolean;
}

export const STORAGE_BUCKET = "media";

/** The public URL of an object in the media bucket. */
export function publicMediaUrl(
  supabaseUrl: string,
  storagePath: string,
): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const path = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/** Clamp a focal coordinate into 0..1; bad data falls back to centre. */
export function clampFocal(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

/**
 * Decide what to show for a slot. Pure, so the fallback rules are tested:
 * no row, or no Supabase URL, means the committed image.
 */
export function resolveSlot(
  key: SlotKey,
  row: SlotRow | null,
  supabaseUrl: string | null,
): ResolvedSlot {
  const definition = MEDIA_SLOTS[key];

  if (row && supabaseUrl && row.storage_path.trim() !== "") {
    const x = clampFocal(row.focal_x);
    const y = clampFocal(row.focal_y);
    return {
      src: publicMediaUrl(supabaseUrl, row.storage_path),
      alt: row.alt.trim() || imageManifest[definition.fallback].alt,
      objectPosition: `${Math.round(x * 100)}% ${Math.round(y * 100)}%`,
      blurDataURL: null,
      replaced: true,
    };
  }

  const fallback = imageManifest[definition.fallback];
  return {
    src: fallback.src,
    alt: fallback.alt,
    objectPosition: "50% 30%",
    blurDataURL: fallback.blurDataURL,
    replaced: false,
  };
}

/**
 * Where a new upload is stored. A fresh path per upload, so a browser or CDN
 * holding the old image can never keep serving it after it is replaced.
 */
export function slotStoragePath(
  key: SlotKey,
  now: Date,
  extension = "jpg",
): string {
  return `slots/${key}/${now.getTime()}.${extension}`;
}

/**
 * The size to downscale an upload to before it leaves the admin's browser.
 * Phone photos are routinely 4000px and 5 MB+; nothing on this site displays an
 * image wider than about 1600px, so the rest is wasted storage and bandwidth.
 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = 2000,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
