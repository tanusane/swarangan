import "server-only";

import { createClient } from "@supabase/supabase-js";

import { BACKUP_TABLES, type BackupTable, type Row } from "@/lib/backup/format";
import { supabaseEnv } from "@/lib/env";
import { secretClient } from "@/lib/supabase/clients";

/** PostgREST returns at most this many rows per request by default. */
const PAGE = 1000;

/**
 * Read every backed-up table in full, page by page, in a stable order.
 *
 * Uses the secret key so nothing is silently omitted by row-level security; the
 * caller has already proven it is an admin AND re-entered the password.
 */
export async function readAllTables(): Promise<Record<BackupTable, Row[]>> {
  const db = secretClient();
  const entries = await Promise.all(
    BACKUP_TABLES.map(async (table) => {
      const rows: Row[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db
          .from(table)
          .select("*")
          // Ordered by the unique key so pages never overlap or skip rows.
          .order(keyOf(table), { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw new Error(`Reading ${table} failed: ${error.message}`);
        rows.push(...(data as Row[]));
        if (!data || data.length < PAGE) break;
      }
      return [table, rows] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<BackupTable, Row[]>;
}

const KEYED: ReadonlySet<BackupTable> = new Set([
  "content_blocks",
  "class_offerings",
  "gallery_albums",
  "media_slots",
]);

/** The column that uniquely identifies a row — also what restore upserts on. */
export function keyOf(table: BackupTable): "key" | "id" {
  return KEYED.has(table) ? "key" : "id";
}

/**
 * Check a password for the signed-in admin without touching their browser
 * session: a throwaway client signs in, and its session is revoked straight
 * away. Returns true only if the password belongs to exactly this user.
 */
export async function passwordMatches(
  email: string,
  userId: string,
  password: string,
): Promise<boolean> {
  const env = supabaseEnv();
  const probe = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await probe.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return false;

  // Revoke only this throwaway session; the admin stays signed in.
  await probe.auth.signOut({ scope: "local" });
  return data.user.id === userId;
}
