"use client";

import { STORAGE_BUCKET, fitWithin } from "@/lib/media/slots";
import { browserClient } from "@/lib/supabase/browser";

/**
 * Preparing and uploading photos from the admin's browser — shared by the image
 * slot editor and the gallery.
 *
 * Photos are downscaled and re-encoded as JPEG before they leave the browser: a
 * phone photo is often 4000px and several megabytes, and nothing on the site is
 * shown wider than about 1600px. They then go straight to Supabase Storage,
 * which keeps them clear of the 4.5 MB limit on requests through the website.
 * The Storage policies refuse the upload for anyone who is not an admin.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Checked before resizing, only to refuse something absurd early. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

/** Why a file cannot be used, or null if it is fine. */
export function rejectReason(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: please choose a JPEG, PNG or WebP photo.`;
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `${file.name}: too large. Please choose a photo under 25 MB.`;
  }
  return null;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process this image.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Could not encode the image.")),
      "image/jpeg",
      0.86,
    ),
  );
  return { blob, width, height };
}

export async function uploadToMedia(path: string, blob: Blob): Promise<void> {
  const { error } = await browserClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      // Paths are unique per upload, so the file itself never changes.
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error(error.message);
}

/** A unique, tidy storage path for a new gallery photo. */
export function galleryPhotoPath(albumKey: string, now = Date.now()): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `gallery/${albumKey}/${now}-${random}.jpg`;
}
