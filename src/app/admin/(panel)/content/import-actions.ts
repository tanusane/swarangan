"use server";

import { updateTag } from "next/cache";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TAG } from "@/lib/content/cache";
import { buildSeedRows } from "@/lib/cms/seed";
import { IMPORTED_FLAG, isImported, settingsSchema } from "@/lib/cms/settings";
import { sessionClient } from "@/lib/supabase/clients";

export type ImportResult = { ok: true } | { ok: false; error: string };

/**
 * One-click import: copy everything the website shows today into the database,
 * verbatim, so it becomes editable.
 *
 * Safe to run twice, and safe if it fails halfway:
 *   - Tables keyed by name (page text, classes, albums) are upserted.
 *   - Tables without a natural key (testimonials, photos, videos) are only
 *     filled when empty, so a second run cannot duplicate a testimonial.
 *   - The "imported" flag is written LAST. Until then the live site keeps
 *     showing its built-in content, so a half-finished import is invisible to
 *     visitors, and simply running it again completes it.
 */
export async function importOriginalContent(): Promise<ImportResult> {
  const admin = await requireAdmin();
  const supabase = await sessionClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (isImported(existing?.data)) {
    return { ok: false, error: "The content has already been imported." };
  }

  const seed = buildSeedRows();

  try {
    const upserts = [
      supabase
        .from("content_blocks")
        .upsert(seed.contentBlocks, { onConflict: "key" }),
      supabase
        .from("class_offerings")
        .upsert(seed.classOfferings, { onConflict: "key" }),
      supabase
        .from("gallery_albums")
        .upsert(seed.galleryAlbums, { onConflict: "key" }),
    ];
    for (const result of await Promise.all(upserts)) {
      if (result.error) throw result.error;
    }

    const fillIfEmpty = async (
      table: string,
      rows: object[],
      scope?: [string, string],
    ) => {
      if (rows.length === 0) return;
      let query = supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (scope) query = query.eq(scope[0], scope[1]);
      const { count, error } = await query;
      if (error) throw error;
      if ((count ?? 0) > 0) return;
      const { error: insertError } = await supabase.from(table).insert(rows);
      if (insertError) throw insertError;
    };

    // Albums must exist before their photos (foreign key).
    await fillIfEmpty("testimonials", seed.testimonials);
    await fillIfEmpty("gallery_photos", seed.galleryPhotos);
    await fillIfEmpty("social_links", seed.socialLinks, [
      "platform",
      "youtube",
    ]);
    await fillIfEmpty("fee_plans", seed.feePlans);

    // Keep any settings the admin already saved before importing; fill the rest.
    const current = (existing?.data ?? {}) as Record<string, unknown>;
    const kept = settingsSchema.partial().safeParse(current);
    const { error: settingsError } = await supabase
      .from("site_settings")
      .upsert({
        id: 1,
        data: {
          ...seed.settings,
          ...(kept.success ? kept.data : {}),
          [IMPORTED_FLAG]: true,
        },
      });
    if (settingsError) throw settingsError;
  } catch (error) {
    console.error("[import] failed", error);
    return {
      ok: false,
      error:
        "The import stopped part-way. Nothing has changed on the live site. Please try again.",
    };
  }

  await writeAudit("content.import", {}, admin.userId);
  updateTag(CONTENT_TAG);
  return { ok: true };
}
