import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/dal";
import { supabaseEnv } from "@/lib/env";
import {
  MEDIA_SLOTS,
  resolveSlot,
  type SlotKey,
  type SlotRow,
} from "@/lib/media/slots";
import { sessionClient } from "@/lib/supabase/clients";

import { SlotEditor } from "./slot-editor";

export const metadata: Metadata = { title: "Images" };

/**
 * Admin: replace the images on the site.
 *
 * One editor per slot in the registry (lib/media/slots.ts), so a new
 * replaceable image appears here automatically. Read with the session client,
 * uncached, so the admin always sees the current state rather than the public
 * cache.
 */
export default async function ImagesPage() {
  await requireAdmin();
  const supabase = await sessionClient();
  const { data } = await supabase
    .from("media_slots")
    .select("key, storage_path, alt, focal_x, focal_y");

  const rows = new Map(
    ((data ?? []) as SlotRow[]).map((row) => [row.key, row]),
  );
  const supabaseUrl = supabaseEnv().NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Images</h1>
        <p className="text-ink-muted mt-1 max-w-2xl">
          Replace a photo on the website. Changes appear on the live site
          straight away. Photos are resized automatically before uploading.
        </p>
      </div>

      {(Object.keys(MEDIA_SLOTS) as SlotKey[]).map((key) => {
        const row = rows.get(key) ?? null;
        return (
          <SlotEditor
            key={key}
            slotKey={key}
            label={MEDIA_SLOTS[key].label}
            where={MEDIA_SLOTS[key].where}
            aspect={MEDIA_SLOTS[key].aspect}
            current={resolveSlot(key, row, supabaseUrl)}
            currentPath={row?.storage_path ?? null}
            currentFocal={{ x: row?.focal_x ?? 0.5, y: row?.focal_y ?? 0.3 }}
          />
        );
      })}
    </div>
  );
}
