"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import {
  directionsHref,
  formattedAddress,
  mapEmbedSrc,
} from "@/lib/site-config";

/**
 * The map, right-sized.
 *
 * The legacy site embedded a full-bleed Google Map that dominated the contact
 * page and loaded on every visit. This is capped to a 16:9 card and does not
 * load the iframe until the visitor asks for it — so the page costs nothing for
 * the majority who only want the phone number.
 *
 * The plain `maps?output=embed` endpoint needs no API key and no billing
 * account, which is what keeps the map inside the free tier.
 */
export function MapEmbed() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="border-sand-300 bg-sand-200 relative aspect-video max-h-[420px] w-full overflow-hidden rounded-(--radius-card) border">
        {loaded ? (
          <iframe
            src={mapEmbedSrc()}
            title={`Map showing ${formattedAddress()}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="group bg-sand-200 hover:bg-sand-300 absolute inset-0 flex size-full flex-col items-center justify-center gap-3 transition-colors"
          >
            {/* A quiet street-grid suggestion, so the placeholder reads as a map
                rather than a broken image. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-blue-950) 1px, transparent 1px), linear-gradient(90deg, var(--color-blue-950) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
              }}
            />
            <span className="bg-magenta-600 relative inline-flex size-12 items-center justify-center rounded-full text-white shadow-(--shadow-lift) transition-transform duration-300 group-hover:scale-110">
              <MapPin aria-hidden="true" className="size-6" />
            </span>
            <span className="relative text-lg font-(--font-display) text-blue-800">
              Show the map
            </span>
            <span className="text-ink-muted relative max-w-xs px-6 text-center text-xs">
              {formattedAddress()}
            </span>
          </button>
        )}
      </div>

      <ButtonLink href={directionsHref()} variant="secondary" size="sm">
        <MapPin aria-hidden="true" className="size-4" />
        Get directions
      </ButtonLink>
    </div>
  );
}
