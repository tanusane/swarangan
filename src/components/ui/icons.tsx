import { Home, MapPin, Monitor, type LucideIcon } from "lucide-react";
import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Icon registry.
 *
 * Generic UI affordances come from lucide. Anything specific to Hindustani music
 * is hand-drawn below, because a generic "music note" for a tanpura is exactly
 * the stock-iconography look the brief asked us to avoid.
 */

export const uiIcons = {
  "map-pin": MapPin,
  home: Home,
  monitor: Monitor,
} as const satisfies Record<string, LucideIcon>;

export type UiIconName = keyof typeof uiIcons;

type GlyphProps = SVGProps<SVGSVGElement>;

/** Shared setup so every custom glyph inherits colour and stroke consistently. */
function Glyph({
  children,
  className,
  ...rest
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("size-6", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Tanpura: long fretless neck, gourd resonator, four strings. */
export function TanpuraIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10 2.5h4v10.5h-4z" />
      <path d="M12 13c3.6 0 5.5 2.4 5.5 5.2S15.3 22 12 22s-5.5-1.2-5.5-3.8S8.4 13 12 13Z" />
      <path d="M10.6 2.8v15.4M11.5 2.8v15.4M12.5 2.8v15.4M13.4 2.8v15.4" />
      <path d="M9.2 18.6h5.6" />
    </Glyph>
  );
}

/** Tabla: the pair — bayan and dayan — seen from the front. */
export function TablaIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.5 10.5c0-1.4 1.6-2.2 3.5-2.2s3.5.8 3.5 2.2v6.8c0 1.5-1.6 2.4-3.5 2.4s-3.5-.9-3.5-2.4z" />
      <ellipse cx="6" cy="10.5" rx="3.5" ry="2.2" />
      <path d="M13.5 8.2c0-1.7 2-2.7 4.2-2.7s4.3 1 4.3 2.7v8.2c0 1.8-2 2.9-4.3 2.9s-4.2-1.1-4.2-2.9z" />
      <ellipse cx="17.7" cy="8.2" rx="4.2" ry="2.7" />
    </Glyph>
  );
}

/** Harmonium: bellows box with a keyboard. */
export function HarmoniumIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.5 9.5h19v9h-19z" />
      <path d="M2.5 9.5 5 5.5h14l2.5 4" />
      <path d="M5.5 14v4.5M8.5 14v4.5M11.5 14v4.5M14.5 14v4.5M17.5 14v4.5" />
      <path d="M2.5 14h19" />
    </Glyph>
  );
}

/** A swar: a note head with the tilde of an ornamented phrase. */
export function SwarIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="8" cy="17" r="3.2" />
      <path d="M11.2 17V5.5l8.3-2.2v3.3" />
      <path d="M11.2 9.8 19.5 7.6" />
    </Glyph>
  );
}

/**
 * Brand glyphs.
 *
 * lucide removed third-party brand icons, and a brand mark must be the real
 * silhouette rather than an approximation, so these are hand-built filled paths.
 */
function BrandGlyph({
  children,
  className,
  ...rest
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("size-5", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function FacebookIcon(props: GlyphProps) {
  return (
    <BrandGlyph {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
    </BrandGlyph>
  );
}

export function YouTubeIcon(props: GlyphProps) {
  return (
    <BrandGlyph {...props}>
      <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.51 2.51 0 0 0-1.77 1.77A26.1 26.1 0 0 0 2 12a26.1 26.1 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.1 26.1 0 0 0 22 12a26.1 26.1 0 0 0-.42-4.81ZM10 15.2V8.8l5.2 3.2Z" />
    </BrandGlyph>
  );
}

/** WhatsApp mark. Brand glyph, so it is a filled path and not stroked. */
export function WhatsAppIcon({ className, ...rest }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("size-5", className)}
      {...rest}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.19-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.25 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

/**
 * The seven swaras of the Hindustani scale, in ascending order (the aroha).
 * Sections step through these, so scrolling the page traverses the scale.
 */
export const SWARAS = [
  { short: "सा", roman: "Sa", name: "Shadja" },
  { short: "रे", roman: "Re", name: "Rishabh" },
  { short: "ग", roman: "Ga", name: "Gandhar" },
  { short: "म", roman: "Ma", name: "Madhyam" },
  { short: "प", roman: "Pa", name: "Pancham" },
  { short: "ध", roman: "Dha", name: "Dhaivat" },
  { short: "नि", roman: "Ni", name: "Nishad" },
] as const;

/** Wraps around past Ni, so a page may hold any number of sections. */
export function swaraForIndex(index: number) {
  return SWARAS[index % SWARAS.length]!;
}
