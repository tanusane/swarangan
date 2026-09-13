import { feePlans } from "@/content/fees";
import { galleryAlbums, galleryPhotos } from "@/content/gallery";
import {
  classOfferings,
  introBlocks,
  locationOptions,
  teacherBlock,
  whyBlock,
} from "@/content/home";
import { featuredVideos } from "@/content/social";
import { testimonials } from "@/content/testimonials";
import {
  BLOCK_PAGES,
  albumToRow,
  blockToRow,
  locationToRow,
  offeringToRow,
  photoToRow,
  testimonialToRow,
  videoToRow,
  type ClassOfferingRow,
  type ContentBlockRow,
  type FeePlanRow,
  type GalleryAlbumRow,
  type GalleryPhotoRow,
  type SocialLinkRow,
  type TestimonialRow,
} from "@/lib/cms/rows";
import { DEFAULT_SETTINGS, IMPORTED_FLAG } from "@/lib/cms/settings";

/**
 * Everything the site shows today, as database rows — what the admin's
 * one-click import writes.
 *
 * Built from the very modules the pages currently render, so the database
 * starts as an exact copy of the live site. Pure: no database access here; the
 * import action decides how to write it.
 */
export interface SeedRows {
  settings: Record<string, unknown>;
  contentBlocks: ContentBlockRow[];
  classOfferings: ClassOfferingRow[];
  testimonials: TestimonialRow[];
  galleryAlbums: GalleryAlbumRow[];
  galleryPhotos: GalleryPhotoRow[];
  socialLinks: SocialLinkRow[];
  feePlans: FeePlanRow[];
}

export function buildSeedRows(): SeedRows {
  const contentBlocks: ContentBlockRow[] = [
    ...introBlocks.map((block, i) => blockToRow(block, BLOCK_PAGES.intro, i)),
    blockToRow(whyBlock, BLOCK_PAGES.section, 0),
    blockToRow(teacherBlock, BLOCK_PAGES.section, 1),
    ...locationOptions.map((option, i) => locationToRow(option, i)),
  ];

  return {
    settings: { ...DEFAULT_SETTINGS, [IMPORTED_FLAG]: true },
    contentBlocks,
    classOfferings: classOfferings.map((offering, i) =>
      offeringToRow(offering, i),
    ),
    testimonials: testimonials.map((item, i) => testimonialToRow(item, i)),
    galleryAlbums: galleryAlbums.map((album, i) => albumToRow(album, i)),
    galleryPhotos: galleryPhotos.map((photo, i) => photoToRow(photo, i)),
    socialLinks: featuredVideos.map((video, i) => videoToRow(video, i)),
    feePlans: feePlans.map((plan, i) => ({
      title: plan.title,
      price: plan.price,
      cadence: plan.cadence,
      note: plan.note ?? null,
      sort: i,
      published: false,
    })),
  };
}
