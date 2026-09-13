import "server-only";

import { cache } from "react";

import { feePlans as seedFees, type FeePlan } from "@/content/fees";
import {
  galleryAlbums as seedAlbums,
  galleryPhotos as seedPhotos,
} from "@/content/gallery";
import {
  classOfferings as seedOfferings,
  introBlocks as seedIntro,
  locationOptions as seedLocations,
  teacherBlock as seedTeacher,
  whyBlock as seedWhy,
} from "@/content/home";
import { featuredVideos as seedVideos } from "@/content/social";
import { testimonials as seedTestimonials } from "@/content/testimonials";
import type {
  ClassOffering,
  ContentBlock,
  GalleryAlbum,
  GalleryPhoto,
  LocationOption,
  Testimonial,
  VideoItem,
} from "@/content/types";
import {
  BLOCK_PAGES,
  rowsToAlbums,
  rowsToBlocks,
  rowsToFees,
  rowsToLocations,
  rowsToOfferings,
  rowsToPhotos,
  rowsToTestimonials,
  rowsToInstagramPosts,
  rowsToVideos,
  type ClassOfferingRow,
  type ContentBlockRow,
  type FeePlanRow,
  type GalleryAlbumRow,
  type GalleryPhotoRow,
  type SocialLinkRow,
  type TestimonialRow,
} from "@/lib/cms/rows";
import {
  DEFAULT_SETTINGS,
  isImported,
  mergeSettings,
  type SiteSettings,
} from "@/lib/cms/settings";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/env";
import { STORAGE_BUCKET } from "@/lib/media/slots";
import { publicClient } from "@/lib/supabase/clients";

/**
 * Where public pages get their content.
 *
 * THE RULE
 *   Until the admin has run the one-click import, pages show the content that
 *   ships with the site. Once imported, the database is the source of truth —
 *   including when the admin has deliberately emptied something, like deleting
 *   every fee plan. If the database is unreachable or errors, pages fall back
 *   to the shipped content rather than showing a broken or empty page.
 *
 * Why the import flag and not "table is empty": between creating the database
 * and clicking Import, every table IS empty. Treating empty as "use the
 * database" would blank the live site in that window; treating empty as "use
 * the fallback" would resurrect content the admin intentionally deleted.
 *
 * Every read goes through the public (publishable-key) client, so row-level
 * security limits it to published content, and is cached under CONTENT_TAG so
 * admin saves refresh the pages on demand.
 */

type Loaded<T> = { source: "database"; data: T } | { source: "shipped" };

const shipped = { source: "shipped" } as const;

/** Settings, plus whether the import has happened. Read once per request. */
const loadSettings = cache(
  async (): Promise<{ settings: SiteSettings; imported: boolean }> => {
    if (!isSupabaseConfigured()) {
      return { settings: DEFAULT_SETTINGS, imported: false };
    }
    try {
      const { data, error } = await publicClient()
        .from("site_settings")
        .select("data")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return {
        settings: mergeSettings(data?.data),
        imported: isImported(data?.data),
      };
    } catch (error) {
      console.error("[cms] settings unavailable, using shipped values", error);
      return { settings: DEFAULT_SETTINGS, imported: false };
    }
  },
);

export const getSettings = cache(
  async (): Promise<SiteSettings> => (await loadSettings()).settings,
);

/** Read a table only if the import has run; otherwise report "shipped". */
async function loadTable<Row>(
  table: string,
  columns: string,
): Promise<Loaded<Row[]>> {
  if (!(await loadSettings()).imported) return shipped;
  try {
    const { data, error } = await publicClient().from(table).select(columns);
    if (error) throw error;
    return { source: "database", data: (data ?? []) as Row[] };
  } catch (error) {
    console.error(`[cms] ${table} unavailable, using shipped content`, error);
    return shipped;
  }
}

const blockRows = cache(() =>
  loadTable<ContentBlockRow>(
    "content_blocks",
    "key, page, sort, eyebrow_en, title_en, body_en, published",
  ),
);

// ---- Public getters ------------------------------------------------------------

export async function getIntroBlocks(): Promise<ContentBlock[]> {
  const rows = await blockRows();
  return rows.source === "database"
    ? rowsToBlocks(rows.data, BLOCK_PAGES.intro)
    : [...seedIntro];
}

/** A single named section (e.g. the teacher's bio), or null if hidden. */
export async function getSection(
  key: "why-hindustani-classical-music" | "tanuja-sane",
): Promise<ContentBlock | null> {
  const rows = await blockRows();
  if (rows.source === "shipped") {
    return key === "tanuja-sane" ? seedTeacher : seedWhy;
  }
  return (
    rowsToBlocks(rows.data, BLOCK_PAGES.section).find((b) => b.key === key) ??
    null
  );
}

export async function getLocations(): Promise<LocationOption[]> {
  const rows = await blockRows();
  return rows.source === "database"
    ? rowsToLocations(rows.data)
    : [...seedLocations];
}

export const getClassOfferings = cache(async (): Promise<ClassOffering[]> => {
  const rows = await loadTable<ClassOfferingRow>(
    "class_offerings",
    "key, title, audience, description, sort, published",
  );
  return rows.source === "database"
    ? rowsToOfferings(rows.data)
    : [...seedOfferings];
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const rows = await loadTable<TestimonialRow>(
    "testimonials",
    "id, author, body, sort, published",
  );
  return rows.source === "database"
    ? rowsToTestimonials(rows.data)
    : [...seedTestimonials];
});

export async function getGallery(): Promise<{
  albums: GalleryAlbum[];
  photos: GalleryPhoto[];
}> {
  const [albums, photos] = await Promise.all([
    loadTable<GalleryAlbumRow>("gallery_albums", "key, title, year, sort"),
    loadTable<GalleryPhotoRow>(
      "gallery_photos",
      "id, album_key, storage_path, alt, caption, width, height, sort, published",
    ),
  ]);

  if (albums.source === "shipped" || photos.source === "shipped") {
    return { albums: [...seedAlbums], photos: [...seedPhotos] };
  }

  const mediaBase = `${supabaseEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${STORAGE_BUCKET}`;
  return {
    albums: rowsToAlbums(albums.data),
    photos: rowsToPhotos(photos.data, mediaBase),
  };
}

export async function getVideos(): Promise<
  (VideoItem & { legacyCaption?: string })[]
> {
  const rows = await loadTable<SocialLinkRow>(
    "social_links",
    "id, platform, embed_ref, title, legacy_caption, featured, enabled, sort",
  );
  return rows.source === "database" ? rowsToVideos(rows.data) : [...seedVideos];
}

/** Instagram posts and reels. None ship with the site; they are added in the admin. */
export async function getInstagramPosts() {
  const rows = await loadTable<SocialLinkRow>(
    "social_links",
    "id, platform, embed_ref, title, legacy_caption, featured, enabled, sort",
  );
  return rows.source === "database" ? rowsToInstagramPosts(rows.data) : [];
}

export async function getFeePlans(): Promise<FeePlan[]> {
  const rows = await loadTable<FeePlanRow>(
    "fee_plans",
    "id, title, price, cadence, note, sort, published",
  );
  return rows.source === "database" ? rowsToFees(rows.data) : [...seedFees];
}
