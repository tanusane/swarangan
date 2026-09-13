import { NextResponse, type NextRequest } from "next/server";

import { sessionClient } from "@/lib/supabase/clients";

/**
 * GET /admin/auth/confirm — where the password-reset email link lands.
 *
 * Accepts both link styles Supabase can send:
 *   ?token_hash=…&type=recovery   (the recommended email template; works even
 *                                  when the link is opened on another device)
 *   ?code=…                       (the default template; same browser only)
 * Either way it exchanges the link for a short session and sends the admin on
 * to choose a new password. Redirects only ever go to fixed paths on this site.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");

  const supabase = await sessionClient();
  let ok = false;

  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const destination = request.nextUrl.clone();
  destination.search = "";
  if (ok) {
    destination.pathname = "/admin/reset-password";
  } else {
    destination.pathname = "/admin/forgot-password";
    destination.searchParams.set("expired", "1");
  }
  return NextResponse.redirect(destination);
}
