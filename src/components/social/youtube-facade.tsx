"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface YouTubeFacadeProps {
  youtubeId: string;
  title: string;
  /** The wording that appeared beside this video on the legacy site. */
  legacyCaption?: string;
  className?: string;
}

/**
 * A YouTube embed that costs nothing until it is wanted.
 *
 * The legacy site put live <iframe>s on the page, which pulls roughly a megabyte
 * of YouTube JavaScript per video before the visitor has asked for anything.
 * This renders the thumbnail and swaps in the real iframe on click, which is the
 * single biggest performance win available on that page.
 *
 * Thumbnails come from i.ytimg.com, which needs no API key. `nocookie` is used
 * for the player so no tracking cookie is set unless the video is actually
 * played.
 */
export function YouTubeFacade({
  youtubeId,
  title,
  legacyCaption,
  className,
}: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={cn("group", className)}>
      <div className="relative aspect-video overflow-hidden rounded-(--radius-card) bg-blue-950 shadow-(--shadow-lift)">
        {playing ? (
          <iframe
            // autoplay is correct here: the visitor just clicked to play.
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 size-full cursor-pointer"
          >
            <Image
              src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
              alt=""
              width={480}
              height={360}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="size-full object-cover transition-transform duration-700 ease-(--ease-swar) group-hover:scale-105"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-blue-950/25 transition-colors duration-300 group-hover:bg-blue-950/10"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="bg-magenta-600/95 inline-flex size-16 items-center justify-center rounded-full text-white shadow-(--shadow-lift-lg) transition-transform duration-300 ease-(--ease-swar) group-hover:scale-110">
                <Play
                  aria-hidden="true"
                  className="ml-0.5 size-7 fill-current"
                />
              </span>
            </span>
            <span className="sr-only">{`Play: ${title}`}</span>
          </button>
        )}
      </div>

      <figcaption className="mt-3">
        <p className="text-lg font-(--font-display) text-blue-800">{title}</p>
        {legacyCaption && legacyCaption !== title && (
          <p className="text-ink-muted mt-0.5 text-xs">{legacyCaption}</p>
        )}
      </figcaption>
    </figure>
  );
}
