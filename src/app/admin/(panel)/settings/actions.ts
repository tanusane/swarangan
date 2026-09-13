"use server";

import { updateTag } from "next/cache";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TAG } from "@/lib/content/cache";
import { fieldErrors } from "@/lib/cms/fields";
import { IMPORTED_FLAG, settingsSchema } from "@/lib/cms/settings";
import { sessionClient } from "@/lib/supabase/clients";

export type SettingsResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Save the site-wide settings. The whole form is validated together, and the
 * import flag stored alongside the settings is preserved whatever the browser
 * sends — it can only ever be set by the import itself.
 */
export async function saveSettings(
  values: Record<string, string>,
): Promise<SettingsResult> {
  const admin = await requireAdmin();

  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const supabase = await sessionClient();
  const { data: existing } = await supabase
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  const imported =
    (existing?.data as Record<string, unknown> | undefined)?.[IMPORTED_FLAG] ===
    true;

  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    data: { ...parsed.data, [IMPORTED_FLAG]: imported },
  });
  if (error) {
    console.error("[settings] save failed", error);
    return { ok: false, error: "Could not save. Please try again." };
  }

  await writeAudit("settings.update", {}, admin.userId);
  updateTag(CONTENT_TAG);
  return { ok: true };
}
