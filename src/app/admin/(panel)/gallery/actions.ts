"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TAG } from "@/lib/content/cache";
import { STORAGE_BUCKET } from "@/lib/media/slots";
import { sessionClient } from "@/lib/supabase/clients";

export type AddPhotoResult = { ok: true } | { ok: false; error: string };

const photoSchema = z.object({
  albumKey: z.string().min(1).max(80),
  storagePath: z.string().min(1).max(300),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  alt: z.string().trim().min(3).max(250),
});

/**
 * Record a photo the browser has just uploaded to Storage.
 *
 * The upload happened directly between the admin's browser and Supabase; this
 * adds the gallery row. The storage path must sit inside this album's own
 * folder, so a tampered request cannot attach an arbitrary object from the
 * bucket to the gallery. If the row cannot be written, the orphaned upload is
 * removed.
 */
export async function addPhoto(input: {
  albumKey: string;
  storagePath: string;
  width: number;
  height: number;
  alt: string;
}): Promise<AddPhotoResult> {
  const admin = await requireAdmin();

  const parsed = photoSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "That upload could not be added." };
  const { albumKey, storagePath, width, height, alt } = parsed.data;

  if (
    !storagePath.startsWith(`gallery/${albumKey}/`) ||
    storagePath.includes("..")
  ) {
    return { ok: false, error: "That upload does not belong to this album." };
  }

  const supabase = await sessionClient();

  const { data: album } = await supabase
    .from("gallery_albums")
    .select("key")
    .eq("key", albumKey)
    .maybeSingle();
  if (!album) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return { ok: false, error: "That album no longer exists." };
  }

  const { data: siblings } = await supabase
    .from("gallery_photos")
    .select("sort")
    .eq("album_key", albumKey);
  const sort =
    (siblings ?? []).reduce(
      (max, row) => Math.max(max, Number(row.sort ?? 0)),
      -1,
    ) + 1;

  const { error } = await supabase.from("gallery_photos").insert({
    album_key: albumKey,
    storage_path: storagePath,
    alt,
    width,
    height,
    sort,
    published: true,
  });
  if (error) {
    console.error("[gallery] could not add photo", error);
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return { ok: false, error: "Could not add the photo. Please try again." };
  }

  await writeAudit("gallery.upload", { albumKey, storagePath }, admin.userId);
  updateTag(CONTENT_TAG);
  return { ok: true };
}
