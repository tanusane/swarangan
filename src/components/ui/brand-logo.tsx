import Image from "next/image";
import type { ComponentProps } from "react";

import { getImage } from "@/components/ui/swar-image";

type BrandLogoProps = Omit<
  ComponentProps<typeof Image>,
  "src" | "width" | "height" | "alt" | "unoptimized"
> & {
  /** "reverse" has the ivory wordmark, for dark grounds. */
  variant?: "full" | "reverse";
  /** Defaults to the manifest's description; pass "" when adjacent text names it. */
  alt?: string;
};

/**
 * The Swarangan logo — the one place it is rendered.
 *
 * Always served `unoptimized`, and that is a measured decision rather than a
 * shortcut. Passed through Next's image optimiser, the transparent logo drew a
 * faint rectangle along its right and bottom edges on the dark hero. The pixels
 * were verified clean at every stage — the source PNG, the optimised AVIF and
 * WebP, and under the transparent regions — and the artefact disappeared only
 * when the untouched PNG was served. It is a rendering quirk of the resampled
 * copy, not bad data.
 *
 * Nothing is lost: these are small PNGs (35–92 kB), already cropped and
 * compressed by scripts/build-assets.mjs, so the optimiser had little to add.
 */
export function BrandLogo({ variant = "full", alt, ...rest }: BrandLogoProps) {
  const logo = getImage(
    variant === "reverse" ? "brand/logo-reverse.png" : "brand/logo.png",
  );

  return (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt={alt ?? logo.alt}
      unoptimized
      {...rest}
    />
  );
}
