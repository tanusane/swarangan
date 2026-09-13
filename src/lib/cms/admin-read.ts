import "server-only";

import { requireAdmin } from "@/lib/auth/dal";
import { collection, type CollectionKey } from "@/lib/cms/collections";
import {
  DEFAULT_SETTINGS,
  isImported,
  mergeSettings,
  type SiteSettings,
} from "@/lib/cms/settings";
import { supabaseEnv } from "@/lib/env";
import { STORAGE_BUCKET } from "@/lib/media/slots";
import { sessionClient } from "@/lib/supabase/clients";

/**
 * Reads for the admin editors.
 *
 * Unlike the public repository these are UNCACHED and run as the signed-in
 * admin, so an editor always shows the true current state — including hidden
 * items, which the public reads never see.
 */

export type EditableRow = Record<string, unknown> & { sort?: number };

export async function loadCollection(
  key: CollectionKey,
): Promise<EditableRow[]> {
  await requireAdmin();
  const def = collection(key);
  const supabase = await sessionClient();

  let query = supabase.from(def.table).select("*");
  if (def.scope) query = query.eq(def.scope.column, def.scope.value);
  const { data, error } = await query.order("sort", { ascending: true });

  if (error) {
    console.error(`[admin] could not load ${key}`, error);
    return [];
  }
  return (data ?? []) as EditableRow[];
}

export async function loadAdminSettings(): Promise<{
  settings: SiteSettings;
  imported: boolean;
}> {
  await requireAdmin();
  const supabase = await sessionClient();
  const { data } = await supabase
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  return data
    ? { settings: mergeSettings(data.data), imported: isImported(data.data) }
    : { settings: DEFAULT_SETTINGS, imported: false };
}

/** The public URL prefix for uploaded media, for admin previews. */
export function mediaBaseUrl(): string {
  return `${supabaseEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${STORAGE_BUCKET}`;
}
