import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, supabaseEnv } from "@/lib/env";

/**
 * Proxy for /admin (Next.js 16 renamed middleware.ts to proxy.ts).
 *
 * Two jobs, and deliberately no more:
 *
 *   1. Refresh the Supabase session. Refresh tokens are single-use, so doing it
 *      here — once per navigation, before any Server Component renders —
 *      stops parallel components from racing to refresh the same token.
 *   2. An OPTIMISTIC redirect: no valid session cookie, no /admin page.
 *
 * This is NOT the security boundary. Per the Next.js guidance the proxy runs on
 * prefetches and must not query the database, so it cannot check the admin
 * allow-list. That check happens in lib/auth/dal.ts, which every admin page and
 * every admin Server Action calls for itself.
 *
 * getClaims() verifies the JWT signature against the project's published keys.
 * getSession() would merely trust the cookie, and must never be used here.
 */
/** Admin pages a signed-out visitor must still reach. */
const PUBLIC_AUTH_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/auth/confirm",
];

export async function proxy(request: NextRequest) {
  // Before Supabase is set up, let the login page explain what to do.
  if (!isSupabaseConfigured()) return NextResponse.next();

  const env = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          // Write to the request so Server Components in this same pass see
          // the refreshed token, and to the response so the browser keeps it.
          for (const { name, value } of toSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const isPublicAuthPage = PUBLIC_AUTH_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!signedIn && !isPublicAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Only the admin area. The public site is static and never touches auth.
  matcher: ["/admin/:path*"],
};
