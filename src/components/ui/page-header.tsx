import Image from "next/image";

import { getImage } from "@/components/ui/swar-image";
import type { ImageKey } from "@/content/generated/image-manifest";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Optional background photograph, scrimmed for legibility. */
  image?: ImageKey;
}

/**
 * The one page header used by every page below the home page.
 *
 * Keeps the drop below the fixed header, the type scale and the scrim identical
 * everywhere, which is what stops the per-page drift the legacy site had.
 */
export function PageHeader({ eyebrow, title, lead, image }: PageHeaderProps) {
  const photo = image ? getImage(image) : null;

  return (
    <section className="relative isolate overflow-hidden bg-blue-950">
      {photo && (
        <>
          <Image
            src={photo.src}
            alt=""
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={photo.blurDataURL}
            style={{ objectPosition: "center 62%" }}
            className="-z-20 object-cover"
          />
          {/* Two passes: a left-weighted wash so the heading always clears AA,
              and a gentle bottom fade into the page below. Kept light enough on
              the right that the photograph is still legibly a photograph. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-950/95 via-blue-950/75 to-blue-950/35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-blue-950/80 via-transparent to-blue-950/55"
          />
        </>
      )}

      <div className="container-swar pt-36 pb-16 md:pt-44 md:pb-20">
        <p className="text-gold-300 mb-3 text-xs tracking-[0.28em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-balance-display text-sand-50 text-4xl md:text-5xl">
          {title}
        </h1>
        {lead && <p className="text-sand-200 mt-5 max-w-2xl text-lg">{lead}</p>}
      </div>
    </section>
  );
}
