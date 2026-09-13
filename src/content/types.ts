/**
 * Content shapes shared by the shipped content and the Supabase reads.
 *
 * Components are typed against these, never against a Supabase row, which is
 * what lets the data source change without touching a single component.
 */

/** A block of page copy. `body` paragraphs are rendered in order. */
export interface ContentBlock {
  /** Stable key, also the Supabase `content_blocks.key` and the anchor id. */
  key: string;
  title: string;
  /** Optional short line above the title (eyebrow / kicker). */
  eyebrow?: string;
  /** Paragraphs, verbatim from the legacy site. */
  body: readonly string[];
}

export interface Testimonial {
  key: string;
  author: string;
  /** Paragraphs, verbatim. Never reworded, reordered or trimmed. */
  body: readonly string[];
}

export type ClassAudience = "children" | "adults" | "advanced";

export interface ClassOffering {
  key: string;
  title: string;
  audience: ClassAudience;
  description: string;
}

export interface LocationOption {
  key: string;
  title: string;
  description: string;
  /** Lucide icon name, resolved through the icon registry. */
  icon: "map-pin" | "home" | "monitor";
}

export interface GalleryPhoto {
  key: string;
  src: string;
  /** Meaningful alt text. Required — an empty string is not accepted. */
  alt: string;
  caption?: string;
  album: string;
  width: number;
  height: number;
}

export interface GalleryAlbum {
  key: string;
  title: string;
  /**
   * Sort hint only — never displayed. Omitted where the year of the event was
   * not supplied, rather than guessed at.
   */
  year?: number;
}

export interface VideoItem {
  key: string;
  youtubeId: string;
  title: string;
  /** Featured videos appear in the curated grid above the channel feed. */
  featured: boolean;
}

export interface Affiliation {
  name: string;
  place: string;
  logo: string;
  note: string;
}
