import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/clients";

/**
 * The Data Access Layer for authorisation — the real line of defence.
 *
 * proxy.ts redirects signed-out visitors away from /admin, but the Next.js
 * guidance is explicit that the proxy is an optimistic convenience, not a
 * security boundary: it runs on prefetches, must not touch the database, and can
 * be bypassed by anything that reaches a Server Action directly. So EVERY admin
 * page and EVERY admin Server Action calls `requireAdmin()` itself.
 *
 * Two separate checks, both required:
 *   1. getClaims() — verifies the session JWT's signature against the project's
 *      published keys. (Never getSession() on the server: it trusts the cookie.)
 *   2. is_admin()  — the user must be on the allow-list. Being signed in to
 *      Supabase is not enough.
 *
 * Wrapped in React's `cache`, so a page that checks from several components
 * makes the round trip once per request.
 */

export interface AdminSession {
  userId: string;
  email: string | null;
}

export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  // Force request-time rendering FIRST, before any early return. Without this,
  // a build with no Supabase keys returns below without touching cookies, Next
  // sees nothing request-specific, and prerenders the admin pages as static
  // HTML at build time. An auth-gated page must never depend on that accident.
  await connection();

  if (!isSupabaseConfigured()) return null;

  const supabase = await sessionClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || isAdmin !== true) return null;

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
});

/** For admin pages and Server Actions: the admin, or a redirect to sign in. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
