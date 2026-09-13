import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { supabaseEnv } from "@/lib/env";

/**
 * The server-side Supabase client factories — one per context, and the only
 * place in the app that constructs a client. Nothing else imports
 * @supabase/* directly.
 *
 * Which to use:
 *
 *   sessionClient()  Acts AS the signed-in user. Row-level security applies,
 *                    so an admin can do exactly what the policies allow and
 *                    nothing more. The default for anything an admin does.
 *
 *   secretClient()   Bypasses row-level security entirely. Reserved for the
 *                    handful of jobs that must happen with no user present:
 *                    recording login attempts before anyone is signed in,
 *                    writing a public enquiry, the keepalive, and the audit
 *                    trail. Never hand its results to a client component
 *                    without deciding exactly which fields are safe.
 */

/** A client bound to the current request's auth cookies. */
export async function sessionClient(): Promise<SupabaseClient> {
  const env = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. That is fine: the proxy
            // refreshes the session on every admin navigation, so a token that
            // needed rotating has already been rotated before we got here.
          }
        },
      },
    },
  );
}

let secret: SupabaseClient | null = null;

/** A client that bypasses row-level security. Server-only; see above. */
export function secretClient(): SupabaseClient {
  if (secret) return secret;

  const env = supabaseEnv();
  secret = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    // No session to persist or refresh: this client is never a user.
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return secret;
}
