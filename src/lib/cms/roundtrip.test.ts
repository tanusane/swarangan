import { describe, expect, it } from "vitest";

import { galleryAlbums, galleryPhotos } from "@/content/gallery";
import {
  classOfferings,
  classesNote,
  introBlocks,
  locationOptions,
  quote,
  teacherBlock,
  whyBlock,
} from "@/content/home";
import { featuredVideos } from "@/content/social";
import { testimonials } from "@/content/testimonials";
import {
  BLOCK_PAGES,
  photoSrc,
  rowsToAlbums,
  rowsToBlocks,
  rowsToLocations,
  rowsToOfferings,
  rowsToPhotos,
  rowsToTestimonials,
  rowsToVideos,
} from "@/lib/cms/rows";
import { buildSeedRows } from "@/lib/cms/seed";
import {
  DEFAULT_SETTINGS,
  addressLineFor,
  isImported,
  mergeSettings,
  phoneE164,
  whatsappHrefFor,
} from "@/lib/cms/settings";

/**
 * The import must not change a single character. Content goes into database
 * rows and back out, and must equal what the site renders today — the
 * testimonials above all.
 */
const seed = buildSeedRows();
/** Database rows get fresh ids, so compare everything except the key. */
const withoutKeys = <T extends { key: string }>(items: readonly T[]) =>
  items.map((item) => {
    const rest: Partial<T> = { ...item };
    delete rest.key;
    return rest;
  });

describe("one-click import round trip is lossless", () => {
  it("testimonials come back byte-identical, in order", () => {
    expect(withoutKeys(rowsToTestimonials(seed.testimonials))).toEqual(
      withoutKeys(testimonials),
    );
  });

  it("the four introductory sections come back identical, in the legacy order", () => {
    expect(rowsToBlocks(seed.contentBlocks, BLOCK_PAGES.intro)).toEqual(
      introBlocks,
    );
  });

  it("the why and teacher sections come back identical", () => {
    expect(rowsToBlocks(seed.contentBlocks, BLOCK_PAGES.section)).toEqual([
      whyBlock,
      teacherBlock,
    ]);
  });

  it("locations come back identical, icons included", () => {
    expect(rowsToLocations(seed.contentBlocks)).toEqual(locationOptions);
  });

  it("class offerings come back identical", () => {
    expect(rowsToOfferings(seed.classOfferings)).toEqual(classOfferings);
  });

  it("gallery albums and photos come back identical", () => {
    expect(rowsToAlbums(seed.galleryAlbums)).toEqual(galleryAlbums);
    expect(withoutKeys(rowsToPhotos(seed.galleryPhotos, null))).toEqual(
      withoutKeys(galleryPhotos),
    );
  });

  it("videos come back identical, legacy captions included", () => {
    expect(withoutKeys(rowsToVideos(seed.socialLinks))).toEqual(
      withoutKeys(featuredVideos),
    );
  });

  it("settings carry the current quote, note and contact details, and mark the import", () => {
    const merged = mergeSettings(seed.settings);
    expect(merged.quoteText).toBe(quote.text);
    expect(merged.classesNote).toBe(classesNote);
    expect(merged).toEqual(DEFAULT_SETTINGS);
    expect(isImported(seed.settings)).toBe(true);
  });
});

describe("rows -> content respects the admin's choices", () => {
  it("hides unpublished testimonials and follows the admin's order", () => {
    const rows = [
      { id: "b", author: "Second", body: ["x"], sort: 2, published: true },
      { id: "a", author: "First", body: ["y"], sort: 1, published: true },
      { id: "c", author: "Hidden", body: ["z"], sort: 0, published: false },
    ];
    expect(rowsToTestimonials(rows).map((t) => t.author)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("serves committed photos locally and uploaded ones from Storage", () => {
    const base = "https://abc.supabase.co/storage/v1/object/public/media";
    expect(photoSrc("/images/events/a.jpg", base)).toBe("/images/events/a.jpg");
    expect(photoSrc("gallery/2026/my photo.jpg", base)).toBe(
      `${base}/gallery/2026/my%20photo.jpg`,
    );
  });

  it("hides disabled videos and ignores non-YouTube links in the video list", () => {
    const rows = [
      {
        platform: "youtube" as const,
        embed_ref: "aaaaaaaaaaa",
        title: "On",
        legacy_caption: null,
        featured: true,
        enabled: true,
        sort: 0,
      },
      {
        platform: "youtube" as const,
        embed_ref: "bbbbbbbbbbb",
        title: "Off",
        legacy_caption: null,
        featured: true,
        enabled: false,
        sort: 1,
      },
      {
        platform: "instagram" as const,
        embed_ref: "https://instagram.com/p/x",
        title: "Post",
        legacy_caption: null,
        featured: false,
        enabled: true,
        sort: 2,
      },
    ];
    expect(rowsToVideos(rows).map((v) => v.title)).toEqual(["On"]);
  });
});

describe("settings are tolerant of bad data", () => {
  it("falls back field by field, keeping the good values", () => {
    const merged = mergeSettings({
      email: "hello@swarangan.sg",
      phoneDisplay: "nope",
      postalCode: "12",
      instagram: "http://insecure.example",
    });
    expect(merged.email).toBe("hello@swarangan.sg");
    expect(merged.phoneDisplay).toBe(DEFAULT_SETTINGS.phoneDisplay);
    expect(merged.postalCode).toBe(DEFAULT_SETTINGS.postalCode);
    expect(merged.instagram).toBe(DEFAULT_SETTINGS.instagram);
  });

  it("survives nothing at all", () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings("garbage")).toEqual(DEFAULT_SETTINGS);
    expect(isImported(null)).toBe(false);
  });

  it("derives phone links, assuming Singapore for a bare 8-digit number", () => {
    expect(phoneE164("+65 8189 5399")).toBe("+6581895399");
    expect(phoneE164("8189 5399")).toBe("+6581895399");
    expect(phoneE164("+91 98200 12345")).toBe("+919820012345");
    expect(whatsappHrefFor(DEFAULT_SETTINGS)).toMatch(
      /^https:\/\/wa\.me\/6581895399\?text=/,
    );
  });

  it("formats the full address", () => {
    expect(addressLineFor(DEFAULT_SETTINGS)).toBe(
      "52 West Coast Crescent, #07-09 West Bay Condominium, Singapore 128036",
    );
  });
});
