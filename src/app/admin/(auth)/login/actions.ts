"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { clientIpFrom } from "@/lib/auth/client-ip";
import { beginAttempt, settleAttempt, throttleKeys } from "@/lib/auth/throttle";
import { isSupabaseConfigured } from "@/lib/env";
import { secretClient, sessionClient } from "@/lib/supabase/clients";

/**
 * Admin sign-in.
 *
 * Every failure a visitor can see reads exactly the same — "Invalid email or
 * password" — whether the address is unknown, the password is wrong, or the
 * account exists but is not an admin. And every response is padded to the same
 * minimum duration. Together those stop the form being used to discover which
 * addresses have accounts.
 *
 * The one deliberate exception is the lockout message, which does say to wait:
 * a real admin who mistypes needs to know why the correct password stopped
 * working, and the throttle has already made it pointless to probe further.
 */

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(256),
});

export interface SignInState {
  error: string | null;
}

const INVALID = "Invalid email or password.";

/**
 * Every response takes at least this long, so a fast "no such user" cannot be
 * told apart from a slower "wrong password" by timing alone.
 */
const MIN_RESPONSE_MS = 900;

async function padTo(startedAt: number): Promise<void> {
  const remaining = MIN_RESPONSE_MS - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
}

function waitMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1
    ? "Too many attempts. Please wait a minute and try again."
    : `Too many attempts. Please wait ${minutes} minutes and try again.`;
}

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const startedAt = Date.now();

  if (!isSupabaseConfigured()) {
    return { error: "The admin panel has not been set up yet. See SETUP.md." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    await padTo(startedAt);
    return { error: INVALID };
  }
  const { email, password } = parsed.data;

  const ip = clientIpFrom((await headers()).get("x-forwarded-for"));
  const keys = throttleKeys(email, ip);

  // Recorded as pending BEFORE the password is checked. See throttle.ts.
  const { ids, decision } = await beginAttempt(keys);

  if (decision.retryAfterSeconds > 0) {
    await settleAttempt(ids, "blocked");
    after(() =>
      writeAudit("auth.sign_in_blocked", {
        email,
        lockedBy: decision.lockedBy,
        retryAfterSeconds: decision.retryAfterSeconds,
      }),
    );
    await padTo(startedAt);
    return { error: waitMessage(decision.retryAfterSeconds) };
  }

  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Correct password but not on the admin allow-list is treated exactly like a
  // wrong password: signed straight back out, same message, same count.
  let isAdmin = false;
  if (!error && data.user) {
    const { data: row } = await secretClient()
      .from("admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    isAdmin = row !== null;
    if (!isAdmin) await supabase.auth.signOut();
  }

  if (error || !isAdmin) {
    await settleAttempt(ids, "failure");
    after(() =>
      writeAudit("auth.sign_in_failed", {
        email,
        reason: error ? "credentials" : "not_admin",
      }),
    );
    await padTo(startedAt);
    return { error: INVALID };
  }

  await settleAttempt(ids, "success");
  after(() => writeAudit("auth.sign_in", { email }, data.user!.id));

  await padTo(startedAt);
  redirect("/admin");
}
