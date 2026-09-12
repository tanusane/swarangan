"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { imageManifest } from "@/content/generated/image-manifest";
import type { GalleryPhoto } from "@/content/types";
import { useCarousel } from "@/lib/use-carousel";

interface LightboxProps {
  photos: readonly GalleryPhoto[];
  startIndex: number;
  onClose: () => void;
}

/**
 * Full-screen photo viewer.
 *
 * Drives index, keyboard arrows and swipe from the shared `useCarousel` engine
 * — the same one behind the hero — so there is one implementation of that
 * behaviour in the app. Autoplay is deliberately off here.
 *
 * Focus is moved into the dialog on open and restored to the trigger on close,
 * and the dialog traps nothing else: Escape always exits.
 */
export function Lightbox({ photos, startIndex, onClose }: LightboxProps) {
  const { index, goTo, next, previous, viewportProps } = useCarousel({
    count: photos.length,
    initialIndex: startIndex,
    loop: true,
  });

  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog so keyboard and screen-reader users land here
  // rather than continuing from the thumbnail behind the overlay.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes. Arrow keys are handled by the carousel's viewportProps.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Stop the page behind the overlay from scrolling.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const photo = photos[index];
  if (!photo) return null;

  const blurDataURL =
    photo.key in imageManifest
      ? imageManifest[photo.key as keyof typeof imageManifest].blurDataURL
      : undefined;

  return (
    <div
      /* viewportProps is spread first so the dialog role wins over the
         carousel's own role="group": this IS a dialog that happens to behave
         like a carousel, and arrow keys still work because the handlers sit on
         this element, which contains the focused close button. */
      {...viewportProps}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[60] flex flex-col bg-blue-950/97 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="text-sand-300 text-sm">
          {index + 1} / {photos.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photograph viewer"
          className="text-sand-200 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <button
          type="button"
          onClick={previous}
          aria-label="Previous photograph"
          className="text-sand-100 hover:bg-magenta-600 absolute left-2 z-10 inline-flex size-12 items-center justify-center rounded-full bg-blue-950/60 transition-colors hover:text-white md:left-6"
        >
          <ChevronLeft aria-hidden="true" className="size-7" />
        </button>

        <figure className="flex max-h-full min-h-0 flex-col items-center gap-4">
          <Image
            key={photo.key}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="100vw"
            {...(blurDataURL
              ? { placeholder: "blur" as const, blurDataURL }
              : {})}
            className="max-h-[72svh] w-auto rounded-md object-contain"
          />
          {photo.caption && (
            <figcaption className="text-sand-300 max-w-2xl text-center text-sm">
              {photo.caption}
            </figcaption>
          )}
        </figure>

        <button
          type="button"
          onClick={next}
          aria-label="Next photograph"
          className="text-sand-100 hover:bg-magenta-600 absolute right-2 z-10 inline-flex size-12 items-center justify-center rounded-full bg-blue-950/60 transition-colors hover:text-white md:right-6"
        >
          <ChevronRight aria-hidden="true" className="size-7" />
        </button>
      </div>

      {/* Thumbnail rail, so a visitor can jump rather than step. */}
      <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pb-5">
        {photos.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show photograph ${i + 1}`}
            aria-current={i === index}
            className={
              i === index
                ? "ring-magenta-500 size-14 shrink-0 overflow-hidden rounded ring-2"
                : "size-14 shrink-0 overflow-hidden rounded opacity-55 transition-opacity hover:opacity-100"
            }
          >
            <Image
              src={item.src}
              alt=""
              width={112}
              height={112}
              sizes="56px"
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
