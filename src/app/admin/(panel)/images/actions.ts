"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TAG } from "@/lib/content/cache";
import { STORAGE_BUCKET, isSlotKey } from "@/lib/media/slots";
import { sessionClient } from "@/lib/supabase/clients";

export type SlotActionResult = { ok: true } | { ok: false; error: string };

const saveSchema = z.object({
  key: z.string(),
  storagePath: z.string().min(1).max(300),
  alt: z
    .string()
    .trim()
    .min(3, "Please describe the photo for visitors who cannot see it.")
    .max(250),
  focalX: z.number().min(0).max(1),
  focalY: z.number().min(0).max(1),
});

/**
 * Point a slot at an uploaded image, or update its description and crop.
 *
 * Runs as the signed-in admin (row-level security applies), re-validates
 * everything the browser sent, and refuses a storage path outside this slot's
 * own folder — so a tampered request cannot make the portrait slot display some
 * other object from the bucket.
 */
export async function saveSlot(input: {
  key: string;
  storagePath: string;
  alt: string;
  focalX: number;
  focalY: number;
}): Promise<SlotActionResult> {
  const admin = await requireAdmin();

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { key, storagePath, alt, focalX, focalY } = parsed.data;

  if (!isSlotKey(key)) return { ok: false, error: "Unknown image slot." };
  if (!storagePath.startsWith(`slots/${key}/`) || storagePath.includes("..")) {
    return { ok: false, error: "That upload does not belong to this image." };
  }

  const supabase = await sessionClient();

  const { data: previous } = await supabase
    .from("media_slots")
    .select("storage_path")
    .eq("key", key)
    .maybeSingle();

  const { error } = await supabase.from("media_slots").upsert({
    key,
    storage_path: storagePath,
    alt,
    focal_x: focalX,
    focal_y: focalY,
  });
  if (error) {
    console.error("[images] save failed", error);
    return { ok: false, error: "Could not save. Please try again." };
  }

  // Tidy up the image this one replaced. Best effort: a leftover file wastes a
  // little storage but breaks nothing.
  const oldPath = previous?.storage_path as string | undefined;
  if (oldPath && oldPath !== storagePath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
  }

  await writeAudit("media.update", { key, storagePath }, admin.userId);
  updateTag(CONTENT_TAG);
  return { ok: true };
}

/** Go back to the image that ships with the site. */
export async function resetSlot(key: string): Promise<SlotActionResult> {
  const admin = await requireAdmin();
  if (!isSlotKey(key)) return { ok: false, error: "Unknown image slot." };

  const supabase = await sessionClient();
  const { data: previous } = await supabase
    .from("media_slots")
    .select("storage_path")
    .eq("key", key)
    .maybeSingle();

  const { error } = await supabase.from("media_slots").delete().eq("key", key);
  if (error) {
    console.error("[images] reset failed", error);
    return { ok: false, error: "Could not reset. Please try again." };
  }

  if (previous?.storage_path) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([previous.storage_path as string]);
  }

  await writeAudit("media.reset", { key }, admin.userId);
  updateTag(CONTENT_TAG);
  return { ok: true };
}
