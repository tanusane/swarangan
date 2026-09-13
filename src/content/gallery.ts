import { imageManifest } from "@/content/generated/image-manifest";
import type { GalleryAlbum, GalleryPhoto } from "@/content/types";
import type { ImageKey } from "@/content/generated/image-manifest";

/**
 * Gallery — PHOTOGRAPHS ONLY.
 *
 * The legacy site mixed videos and photos on one page. Videos now live under
 * Social Presence; this page is purely the photographic record of the annual
 * functions.
 *
 * Dimensions and alt text are read from the generated image manifest rather
 * than repeated here, so they can never fall out of step with the actual files.
 */

export const galleryAlbums: readonly GalleryAlbum[] = [
  { key: "af2026", title: "Annual Function 2026", year: 2026 },
  { key: "af2024", title: "Annual Function 2024", year: 2024 },
  { key: "af2022", title: "Annual Function 2022", year: 2022 },
];

interface PhotoSeed {
  image: ImageKey;
  album: string;
  caption?: string;
}

const PHOTO_SEED: readonly PhotoSeed[] = [
  {
    image: "events/af2026-thumri-se-ghazal-tak.jpg",
    album: "af2026",
    caption:
      "Thumri Se Ghazal Tak — a journey through melody, poetry and emotion",
  },
  {
    image: "events/af2024-young-students.jpg",
    album: "af2024",
    caption: "The youngest batch on stage",
  },
  {
    image: "events/af2024-ensemble.jpg",
    album: "af2024",
    caption: "Students and teachers together",
  },
  {
    image: "events/af2024-auditorium.jpg",
    album: "af2024",
    caption: "A full house",
  },
  {
    image: "events/af2022-1.jpg",
    album: "af2022",
    caption: "Salutations to the Gurus — the whole of Swarangan on stage",
  },
  { image: "events/af2022-2.jpg", album: "af2022" },
  { image: "events/af2022-3.jpg", album: "af2022" },
  { image: "events/af2022-4.jpg", album: "af2022" },
];

export const galleryPhotos: readonly GalleryPhoto[] = PHOTO_SEED.map(
  ({ image, album, caption }) => {
    const entry = imageManifest[image];
    return {
      key: image,
      src: entry.src,
      alt: entry.alt,
      width: entry.width,
      height: entry.height,
      album,
      ...(caption ? { caption } : {}),
    };
  },
);

/** Photos for one album, in seed order. */
export function photosInAlbum(albumKey: string): readonly GalleryPhoto[] {
  return galleryPhotos.filter((photo) => photo.album === albumKey);
}
