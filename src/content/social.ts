import type { VideoItem } from "@/content/types";

/**
 * Social Presence — the videos and social channels.
 *
 * The legacy site's captions could not be reliably matched to their videos (the
 * page builder emitted them as loose siblings, and there were more embeds than
 * captions). Titles below are the authoritative ones from YouTube itself, read
 * through the public oEmbed endpoint, so each video is labelled with what it
 * actually is rather than a guess.
 *
 * `legacyCaption` preserves the wording that appeared on the old site wherever
 * it was unambiguous, so nothing Tanuja wrote is lost.
 */

export const featuredVideos: readonly (VideoItem & {
  legacyCaption?: string;
})[] = [
  {
    key: "nirbhay-nirgun",
    youtubeId: "elpU_EG-hN8",
    title: "Nirbhay Nirgun Fusion",
    legacyCaption: "Nirbhay Nirgun",
    featured: true,
  },
  {
    key: "nirguni-bhajan",
    youtubeId: "7V5fv_MPIoM",
    title: "Nirguni bhajan",
    legacyCaption: "Nirgun bhajan",
    featured: true,
  },
  {
    key: "raag-bhairav-tarana",
    youtubeId: "AO7hukxn2wI",
    title: "Raag Bhairav Tarana",
    legacyCaption: "Bhairav tarana",
    featured: true,
  },
  {
    key: "jamuna-kinare",
    youtubeId: "87c4J06MAIg",
    title: "Jamuna Kinare Mero Gaon",
    featured: true,
  },
  {
    key: "johar-mai-baap",
    youtubeId: "NoES1omnTa0",
    title: "Johar Mai baap",
    featured: false,
  },
  {
    key: "mi-radhika",
    youtubeId: "nJ-zUb4UyCk",
    title: "Mi Radhika",
    featured: false,
  },
  {
    key: "avagha-rang-ek-jhala",
    youtubeId: "-qhV7DiRF-I",
    title: "Avagha rang ek jhala",
    featured: false,
  },
];
