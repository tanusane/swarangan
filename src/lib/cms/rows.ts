import type { FeePlan } from "@/content/fees";
import type {
  ClassAudience,
  ClassOffering,
  ContentBlock,
  GalleryAlbum,
  GalleryPhoto,
  LocationOption,
  Testimonial,
  VideoItem,
} from "@/content/types";

/**
 * Database row shapes, and the pure conversions between rows and the content
 * types pages render.
 *
 * Both directions live here, side by side, so they are tested as a round trip:
 * content -> rows -> content must come back byte-identical. That is what
 * guarantees the one-click import cannot alter a testimonial or a paragraph.
 */

// ---- Row shapes (match supabase/migrations) -----------------------------------

export interface TestimonialRow {
  id?: string;
  author: string;
  body: string[];
  sort: number;
  published: boolean;
}

export interface ContentBlockRow {
  key: string;
  page: string;
  sort: number;
  eyebrow_en: string | null;
  title_en: string;
  body_en: string[];
  published: boolean;
}

export interface ClassOfferingRow {
  key: string;
  title: string;
  audience: ClassAudience;
  description: string;
  sort: number;
  published: boolean;
}

export interface GalleryAlbumRow {
  key: string;
  title: string;
  year: number | null;
  sort: number;
}

export interface GalleryPhotoRow {
  id?: string;
  album_key: string;
  storage_path: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
  sort: number;
  published: boolean;
}

export interface SocialLinkRow {
  id?: string;
  platform: "youtube" | "instagram" | "facebook";
  embed_ref: string;
  title: string;
  legacy_caption: string | null;
  featured: boolean;
  enabled: boolean;
  sort: number;
}

export interface FeePlanRow {
  id?: string;
  title: string;
  price: string;
  cadence: string;
  note: string | null;
  sort: number;
  published: boolean;
}

// ---- Pages ---------------------------------------------------------------------

/** The page groups content blocks belong to. */
export const BLOCK_PAGES = {
  /** The four introductory sections at the top of the home page, in order. */
  intro: "home-intro",
  /** Single named sections: "Why Hindustani Classical Music", the teacher. */
  section: "home-section",
  /** Where classes happen: studio, home, online. */
  locations: "locations",
} as const;

const LOCATION_ICONS: Record<string, LocationOption["icon"]> = {
  "at-class-location": "map-pin",
  "home-classes": "home",
  "online-classes": "monitor",
};

// ---- Content -> rows (used by the one-click import) ------------------------------

export function testimonialToRow(
  item: Testimonial,
  sort: number,
): TestimonialRow {
  return { author: item.author, body: [...item.body], sort, published: true };
}

export function blockToRow(
  block: ContentBlock,
  page: string,
  sort: number,
): ContentBlockRow {
  return {
    key: block.key,
    page,
    sort,
    eyebrow_en: block.eyebrow ?? null,
    title_en: block.title,
    body_en: [...block.body],
    published: true,
  };
}

export function locationToRow(
  option: LocationOption,
  sort: number,
): ContentBlockRow {
  return {
    key: option.key,
    page: BLOCK_PAGES.locations,
    sort,
    eyebrow_en: null,
    title_en: option.title,
    body_en: [option.description],
    published: true,
  };
}

export function offeringToRow(
  offering: ClassOffering,
  sort: number,
): ClassOfferingRow {
  return { ...offering, sort, published: true };
}

export function albumToRow(album: GalleryAlbum, sort: number): GalleryAlbumRow {
  return { key: album.key, title: album.title, year: album.year ?? null, sort };
}

/**
 * Photos that ship with the site are stored by their public path ("/images/…"),
 * not uploaded to Storage. An uploaded photo's storage_path has no leading
 * slash. `photoSrc` tells the two apart.
 */
export function photoToRow(photo: GalleryPhoto, sort: number): GalleryPhotoRow {
  return {
    album_key: photo.album,
    storage_path: photo.src,
    alt: photo.alt,
    caption: photo.caption ?? null,
    width: photo.width,
    height: photo.height,
    sort,
    published: true,
  };
}

export function videoToRow(
  video: VideoItem & { legacyCaption?: string },
  sort: number,
): SocialLinkRow {
  return {
    platform: "youtube",
    embed_ref: video.youtubeId,
    title: video.title,
    legacy_caption: video.legacyCaption ?? null,
    featured: video.featured,
    enabled: true,
    sort,
  };
}

// ---- Rows -> content (used by public pages) ----------------------------------------

const bySort = <T extends { sort: number }>(rows: readonly T[]) =>
  [...rows].sort((a, b) => a.sort - b.sort);

export function rowsToTestimonials(
  rows: readonly TestimonialRow[],
): Testimonial[] {
  return bySort(rows)
    .filter((row) => row.published)
    .map((row, i) => ({
      key: row.id ?? `testimonial-${i}`,
      author: row.author,
      body: row.body,
    }));
}

export function rowToBlock(row: ContentBlockRow): ContentBlock {
  return {
    key: row.key,
    title: row.title_en,
    ...(row.eyebrow_en ? { eyebrow: row.eyebrow_en } : {}),
    body: row.body_en,
  };
}

export function rowsToBlocks(
  rows: readonly ContentBlockRow[],
  page: string,
): ContentBlock[] {
  return bySort(rows)
    .filter((row) => row.page === page && row.published)
    .map(rowToBlock);
}

export function rowsToLocations(
  rows: readonly ContentBlockRow[],
): LocationOption[] {
  return bySort(rows)
    .filter((row) => row.page === BLOCK_PAGES.locations && row.published)
    .map((row) => ({
      key: row.key,
      title: row.title_en,
      description: row.body_en.join("\n\n"),
      icon: LOCATION_ICONS[row.key] ?? "map-pin",
    }));
}

export function rowsToOfferings(
  rows: readonly ClassOfferingRow[],
): ClassOffering[] {
  return bySort(rows)
    .filter((row) => row.published)
    .map(({ key, title, audience, description }) => ({
      key,
      title,
      audience,
      description,
    }));
}

export function rowsToAlbums(rows: readonly GalleryAlbumRow[]): GalleryAlbum[] {
  return bySort(rows).map((row) => ({
    key: row.key,
    title: row.title,
    ...(row.year !== null ? { year: row.year } : {}),
  }));
}

/** Where to load a gallery photo from: a committed file, or Supabase Storage. */
export function photoSrc(
  storagePath: string,
  publicMediaBase: string | null,
): string {
  if (storagePath.startsWith("/")) return storagePath;
  if (!publicMediaBase) return storagePath;
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${publicMediaBase.replace(/\/+$/, "")}/${encoded}`;
}

export function rowsToPhotos(
  rows: readonly GalleryPhotoRow[],
  publicMediaBase: string | null,
): GalleryPhoto[] {
  return bySort(rows)
    .filter((row) => row.published)
    .map((row, i) => ({
      key: row.id ?? `${row.album_key}-${i}`,
      src: photoSrc(row.storage_path, publicMediaBase),
      alt: row.alt,
      ...(row.caption ? { caption: row.caption } : {}),
      album: row.album_key,
      width: row.width,
      height: row.height,
    }));
}

export function rowsToVideos(
  rows: readonly SocialLinkRow[],
): (VideoItem & { legacyCaption?: string })[] {
  return bySort(rows)
    .filter((row) => row.platform === "youtube" && row.enabled)
    .map((row, i) => ({
      key: row.id ?? `video-${i}`,
      youtubeId: row.embed_ref,
      title: row.title,
      featured: row.featured,
      ...(row.legacy_caption ? { legacyCaption: row.legacy_caption } : {}),
    }));
}

export function rowsToFees(rows: readonly FeePlanRow[]): FeePlan[] {
  return bySort(rows)
    .filter((row) => row.published)
    .map((row, i) => ({
      key: row.id ?? `fee-${i}`,
      title: row.title,
      price: row.price,
      cadence: row.cadence,
      ...(row.note ? { note: row.note } : {}),
    }));
}
