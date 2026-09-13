import "server-only";

import { isSupabaseConfigured, supabaseEnv } from "@/lib/env";
import {
  resolveSlot,
  type ResolvedSlot,
  type SlotKey,
  type SlotRow,
} from "@/lib/media/slots";
import { publicClient } from "@/lib/supabase/clients";

/**
 * Read a media slot for a public page.
 *
 * Never throws. If Supabase is not configured, unreachable, or returns an
 * error, the committed fallback image is shown — a database problem must not
 * take a photograph off the home page.
 */
export async function getSlot(key: SlotKey): Promise<ResolvedSlot> {
  if (!isSupabaseConfigured()) return resolveSlot(key, null, null);

  try {
    const { data, error } = await publicClient()
      .from("media_slots")
      .select("key, storage_path, alt, focal_x, focal_y")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`[media] could not read slot ${key}`, error.message);
      return resolveSlot(key, null, null);
    }
    return resolveSlot(
      key,
      (data as SlotRow | null) ?? null,
      supabaseEnv().NEXT_PUBLIC_SUPABASE_URL,
    );
  } catch (error) {
    console.error(`[media] slot ${key} unavailable`, error);
    return resolveSlot(key, null, null);
  }
}
