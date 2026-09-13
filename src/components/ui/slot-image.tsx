import Image from "next/image";

import { getSlot } from "@/lib/media/read";
import { MEDIA_SLOTS, type SlotKey } from "@/lib/media/slots";
import { cn } from "@/lib/utils";

/**
 * An admin-replaceable image. Renders the uploaded replacement if there is one,
 * otherwise the image that ships with the site.
 *
 * The frame's aspect ratio comes from the slot definition, and the image is
 * cropped into it at the admin's chosen focal point — so a replacement photo of
 * any shape still fits the layout, and the face stays in frame.
 */
export async function SlotImage({
  slot,
  sizes,
  priority = false,
  className,
  imageClassName,
}: {
  slot: SlotKey;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const image = await getSlot(slot);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: MEDIA_SLOTS[slot].aspect }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        {...(image.blurDataURL
          ? { placeholder: "blur" as const, blurDataURL: image.blurDataURL }
          : {})}
        style={{ objectPosition: image.objectPosition }}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
