"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * The Supabase client for admin screens running in the browser — used only for
 * uploading images straight to Storage.
 *
 * Uploads go browser -> Supabase directly rather than through a Server Action
 * because a Vercel function cannot accept a request body over 4.5 MB, and a
 * phone photo can exceed that. Security does not depend on this being the
 * browser: the session cookie identifies the admin, and the Storage policies in
 * the migration refuse the upload for anyone not on the admin allow-list.
 *
 * The publishable key and URL are public by design; nothing secret is here.
 */
export function browserClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. See SETUP.md.");
  }

  client = createBrowserClient(url, key);
  return client;
}
