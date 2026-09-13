"use client";

import Image from "next/image";
import { useState } from "react";

import { Lightbox } from "@/components/gallery/lightbox";
import { Reveal } from "@/components/ui/reveal";
import { blurFor } from "@/components/ui/swar-image";
import type { GalleryAlbum, GalleryPhoto } from "@/content/types";

interface PhotoGridProps {
  albums: readonly GalleryAlbum[];
  photos: readonly GalleryPhoto[];
}

/**
 * Album-grouped photograph grid with a lightbox.
 *
 * One flat photo list is handed to the lightbox regardless of which album a
 * thumbnail was clicked in, so a visitor can browse straight through the whole
 * gallery rather than being trapped inside one year.
 */
export function PhotoGrid({ albums, photos }: PhotoGridProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-16">
        {albums.map((album) => {
          const inAlbum = photos.filter((photo) => photo.album === album.key);
          if (inAlbum.length === 0) return null;

          return (
            <section key={album.key} aria-labelledby={`album-${album.key}`}>
              <Reveal>
                <div className="mb-6 flex items-baseline gap-4">
                  <h2
                    id={`album-${album.key}`}
                    className="text-2xl md:text-3xl"
                  >
                    {album.title}
                  </h2>
                  <span
                    className="bg-sand-300 h-px flex-1"
                    aria-hidden="true"
                  />
                </div>
              </Reveal>

              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5">
                {inAlbum.map((photo, i) => {
                  // Index into the FLAT list so the lightbox can walk the whole
                  // gallery from wherever the visitor entered it.
                  const flatIndex = photos.indexOf(photo);
                  const blurDataURL = blurFor(photo.src);

                  return (
                    <Reveal
                      key={photo.key}
                      as="li"
                      variant="leaf"
                      delay={i * 0.05}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenAt(flatIndex)}
                        className="group bg-sand-200 relative block w-full overflow-hidden rounded-(--radius-card) shadow-(--shadow-lift) transition-shadow duration-300 hover:shadow-(--shadow-lift-lg)"
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          width={photo.width}
                          height={photo.height}
                          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 50vw"
                          {...(blurDataURL
                            ? { placeholder: "blur" as const, blurDataURL }
                            : {})}
                          className="aspect-4/3 w-full object-cover transition-transform duration-700 ease-(--ease-swar) group-hover:scale-105"
                        />
                        {/* Caption appears on hover and always on touch, where
                            there is no hover to reveal it. */}
                        {photo.caption && (
                          <span className="text-sand-100 absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/90 to-transparent p-3 pt-8 text-left text-xs opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                            {photo.caption}
                          </span>
                        )}
                        <span className="sr-only">View larger</span>
                      </button>
                    </Reveal>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {openAt !== null && (
        <Lightbox
          photos={photos}
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </>
  );
}
