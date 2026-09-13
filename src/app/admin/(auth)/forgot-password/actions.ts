"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { clientIpFrom } from "@/lib/auth/client-ip";
import { beginAttempt, settleAttempt, throttleKeys } from "@/lib/auth/throttle";
import { isSupabaseConfigured } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";
import { sessionClient } from "@/lib/supabase/clients";

/**
 * Request a password-reset email.
 *
 * The reply is identical whether or not the address has an account, so this
 * form cannot be used to discover who the admins are. Requests are limited per
 * address (and per address from one place), on counters kept separate from
 * sign-in, so asking for resets can never lock anyone out of signing in.
 */

export interface ResetRequestState {
  status: "idle" | "sent" | "error";
  message: string | null;
}

const emailSchema = z.string().trim().toLowerCase().email().max(254);

const SENT =
  "If that address belongs to an admin, a reset link is on its way. It works once and expires in an hour — check spam too.";

/** Where the email link should land: this site, never a host from the request. */
function confirmUrl(origin: string | null): string {
  const allowed =
    origin &&
    (origin === new URL(siteConfig.url).origin ||
      /^http:\/\/localhost(:\d+)?$/.test(origin));
  return `${allowed ? origin : siteConfig.url}/admin/auth/confirm`;
}

export async function requestPasswordReset(
  _previous: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "The admin panel is not set up yet." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  const email = parsed.data;

  const requestHeaders = await headers();
  const ip = clientIpFrom(requestHeaders.get("x-forwarded-for"));
  // Separate counters from sign-in: "reset:" keys, and no shared per-IP key.
  const keys = throttleKeys(`reset:${email}`, ip).filter(
    (key) => key.kind !== "ip",
  );
  const { ids, decision } = await beginAttempt(keys);

  if (decision.retryAfterSeconds > 0) {
    await settleAttempt(ids, "blocked");
    return {
      status: "error",
      message:
        "Too many reset requests. Please wait a few minutes and try again.",
    };
  }
  // Every request counts toward the limit, successful or not.
  await settleAttempt(ids, "failure");

  const supabase = await sessionClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmUrl(requestHeaders.get("origin")),
  });
  if (error) console.error("[auth] reset email failed", error.message);

  after(() => writeAudit("auth.password_reset_requested", { email }));
  return { status: "sent", message: SENT };
}
