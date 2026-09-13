import { BLOCK_PAGES } from "@/lib/cms/rows";

/**
 * The editable collections, described once.
 *
 * Each admin editor — testimonials, videos, class descriptions, fees, page text,
 * gallery albums and photos — is this ONE description rendered by one generic
 * list-and-form editor and saved by one set of generic, validated server
 * actions. Adding a new editable collection is an entry here, not a new screen.
 *
 * Deliberately free of server-only imports: the browser editor reads the field
 * definitions from here too, so client and server can never disagree about what
 * a form contains.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "paragraphs"
  | "boolean"
  | "youtube"
  | "instagram"
  | "year";

export interface FieldDef {
  /** Column name in the table. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  hint?: string;
  placeholder?: string;
}

export interface CollectionDef {
  table: string;
  /** Plural, for headings: "Testimonials". */
  label: string;
  /** Singular, for buttons: "testimonial". */
  singular: string;
  /** One or two plain sentences at the top of the editor. */
  intro: string;
  idColumn: "id" | "key";
  fields: readonly FieldDef[];
  /** The field shown as each item's heading in the list. */
  titleField: string;
  /** Can the admin change the order? */
  sortable: boolean;
  /**
   * When set, reordering only happens among rows sharing this column's value —
   * photos move within their album, never between albums.
   */
  groupColumn?: string;
  /** The show/hide switch, if the table has one. */
  visibility?: { column: "published" | "enabled"; on: string; off: string };
  canCreate: boolean;
  canDelete: boolean;
  /** Rows this editor may see and touch; enforced on the server for every write. */
  scope?: { column: string; value: string };
  /** Fixed values added to every new row, e.g. the platform of a video. */
  insertDefaults?: Readonly<Record<string, string | boolean>>;
  /** For tables keyed by text: derive a new row's key from this field. */
  keyFrom?: string;
  /** A column holding an uploaded file, removed from Storage on delete. */
  storageColumn?: string;
  /** Child rows whose uploaded files must be removed when a parent is deleted. */
  cascadeStorage?: { table: string; foreignKey: string; storageColumn: string };
}

const PARAGRAPHS_HINT =
  "Leave an empty line between paragraphs. Spacing inside a paragraph is kept exactly as typed.";

/** Shared by the fixed, prose-style page sections. */
const PAGE_SECTION = {
  fields: [
    { name: "eyebrow_en", label: "Small heading", type: "text", max: 60 },
    {
      name: "title_en",
      label: "Heading",
      type: "text",
      required: true,
      max: 140,
    },
    {
      name: "body_en",
      label: "Text",
      type: "paragraphs",
      required: true,
      max: 8000,
      hint: PARAGRAPHS_HINT,
    },
  ],
  titleField: "title_en",
  sortable: false,
  visibility: { column: "published", on: "Shown", off: "Hidden" },
  canCreate: false,
  canDelete: false,
} as const;

export const COLLECTIONS = {
  testimonials: {
    table: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    intro:
      "What parents and students have said. Hidden testimonials stay saved but do not appear on the website.",
    idColumn: "id",
    fields: [
      { name: "author", label: "Name", type: "text", required: true, max: 120 },
      {
        name: "body",
        label: "Testimonial",
        type: "paragraphs",
        required: true,
        max: 4000,
        hint: PARAGRAPHS_HINT,
      },
    ],
    titleField: "author",
    sortable: true,
    visibility: { column: "published", on: "Shown", off: "Hidden" },
    canCreate: true,
    canDelete: true,
  },

  videos: {
    table: "social_links",
    label: "Videos",
    singular: "video",
    intro:
      "YouTube performances on the Social Presence page. Paste a YouTube link or video ID. Featured videos appear first.",
    idColumn: "id",
    fields: [
      {
        name: "embed_ref",
        label: "YouTube link or video ID",
        type: "youtube",
        required: true,
        placeholder: "https://www.youtube.com/watch?v=…",
      },
      { name: "title", label: "Title", type: "text", required: true, max: 160 },
      {
        name: "legacy_caption",
        label: "Caption (optional)",
        type: "text",
        max: 200,
        hint: "A short line shown under the title.",
      },
      { name: "featured", label: "Featured", type: "boolean" },
    ],
    titleField: "title",
    sortable: true,
    visibility: { column: "enabled", on: "Shown", off: "Hidden" },
    canCreate: true,
    canDelete: true,
    scope: { column: "platform", value: "youtube" },
    insertDefaults: { platform: "youtube" },
  },

  instagramPosts: {
    table: "social_links",
    label: "Instagram posts and reels",
    singular: "Instagram post",
    intro:
      "Shown in the Instagram section of the Social Presence page. On Instagram, open the post or reel, tap Share, then Copy link, and paste it here.",
    idColumn: "id",
    fields: [
      {
        name: "embed_ref",
        label: "Instagram post or reel link",
        type: "instagram",
        required: true,
        placeholder: "https://www.instagram.com/reel/…",
      },
      {
        name: "title",
        label: "Short label",
        type: "text",
        required: true,
        max: 120,
        hint: "Only for you, to tell posts apart here.",
      },
    ],
    titleField: "title",
    sortable: true,
    visibility: { column: "enabled", on: "Shown", off: "Hidden" },
    canCreate: true,
    canDelete: true,
    scope: { column: "platform", value: "instagram" },
    insertDefaults: { platform: "instagram" },
  },

  classes: {
    table: "class_offerings",
    label: "Classes",
    singular: "class",
    intro:
      "The class descriptions on the home and Classes pages. The three class types are fixed; their wording is yours to change.",
    idColumn: "key",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 120 },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
        max: 600,
      },
    ],
    titleField: "title",
    sortable: true,
    visibility: { column: "published", on: "Shown", off: "Hidden" },
    canCreate: false,
    canDelete: false,
  },

  fees: {
    table: "fee_plans",
    label: "Fees and timings",
    singular: "fee plan",
    intro:
      "Nothing here is public until you switch a plan to Shown. The fees section appears on the Classes page once at least one plan is shown.",
    idColumn: "id",
    fields: [
      {
        name: "title",
        label: "Batch or plan",
        type: "text",
        required: true,
        max: 120,
      },
      {
        name: "price",
        label: "Fee",
        type: "text",
        required: true,
        max: 60,
        placeholder: "e.g. S$120 / month",
      },
      {
        name: "cadence",
        label: "Timing",
        type: "text",
        required: true,
        max: 160,
        placeholder: "e.g. Saturdays, 10–11am",
      },
      { name: "note", label: "Note (optional)", type: "textarea", max: 400 },
    ],
    titleField: "title",
    sortable: true,
    visibility: { column: "published", on: "Shown", off: "Hidden" },
    canCreate: true,
    canDelete: true,
  },

  introSections: {
    table: "content_blocks",
    label: "Home page — the tradition",
    singular: "section",
    intro:
      "The four sections at the top of the home page. Their order follows the original site and is kept fixed.",
    idColumn: "key",
    ...PAGE_SECTION,
    scope: { column: "page", value: BLOCK_PAGES.intro },
  },

  namedSections: {
    table: "content_blocks",
    label: "Home page — why, and the teacher",
    singular: "section",
    intro:
      "“Why Hindustani Classical Music” and Tanuja's biography. Both also appear on the Classes page where relevant.",
    idColumn: "key",
    ...PAGE_SECTION,
    scope: { column: "page", value: BLOCK_PAGES.section },
  },

  locations: {
    table: "content_blocks",
    label: "Where classes happen",
    singular: "location",
    intro: "The studio, home classes and online classes.",
    idColumn: "key",
    fields: [
      {
        name: "title_en",
        label: "Heading",
        type: "text",
        required: true,
        max: 80,
      },
      {
        name: "body_en",
        label: "Description",
        type: "paragraphs",
        required: true,
        max: 600,
      },
    ],
    titleField: "title_en",
    sortable: true,
    visibility: { column: "published", on: "Shown", off: "Hidden" },
    canCreate: false,
    canDelete: false,
    scope: { column: "page", value: BLOCK_PAGES.locations },
  },

  albums: {
    table: "gallery_albums",
    label: "Albums",
    singular: "album",
    intro:
      "Gallery albums, newest first is usual. Deleting an album also deletes its photos.",
    idColumn: "key",
    fields: [
      {
        name: "title",
        label: "Album name",
        type: "text",
        required: true,
        max: 120,
      },
      {
        name: "year",
        label: "Year (optional)",
        type: "year",
        hint: "Not shown on the site; only helps keep albums organised.",
      },
    ],
    titleField: "title",
    sortable: true,
    canCreate: true,
    canDelete: true,
    keyFrom: "title",
    cascadeStorage: {
      table: "gallery_photos",
      foreignKey: "album_key",
      storageColumn: "storage_path",
    },
  },

  photos: {
    table: "gallery_photos",
    label: "Photos",
    singular: "photo",
    intro: "",
    idColumn: "id",
    fields: [
      {
        name: "caption",
        label: "Caption (optional)",
        type: "text",
        max: 200,
        hint: "Shown on the photo in the gallery.",
      },
      {
        name: "alt",
        label: "Describe the photo",
        type: "text",
        required: true,
        max: 250,
        hint: "Read aloud to visitors using screen readers, and used by search engines.",
      },
    ],
    titleField: "caption",
    sortable: true,
    groupColumn: "album_key",
    visibility: { column: "published", on: "Shown", off: "Hidden" },
    canCreate: false,
    canDelete: true,
    storageColumn: "storage_path",
  },
} as const satisfies Record<string, CollectionDef>;

export type CollectionKey = keyof typeof COLLECTIONS;

export function isCollectionKey(value: string): value is CollectionKey {
  return Object.hasOwn(COLLECTIONS, value);
}

export function collection(key: CollectionKey): CollectionDef {
  return COLLECTIONS[key];
}
