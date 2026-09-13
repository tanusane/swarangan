import "server-only";

import { createHmac } from "node:crypto";

import { supabaseEnv } from "@/lib/env";
import { secretClient } from "@/lib/supabase/clients";
import {
  WINDOW_MS,
  decideLockout,
  type Attempt,
  type AttemptKind,
  type AttemptOutcome,
  type LockoutDecision,
} from "@/lib/auth/lockout";

/**
 * Login throttle: the database half of the lockout.
 *
 * The policy itself lives in lockout.ts as a pure, tested function. This file
 * only stores and fetches attempts, using the secret client because nobody is
 * signed in yet when an attempt happens, and login_attempts deliberately has no
 * row-level-security policy that would let the public key touch it.
 *
 * Keys are stored as keyed HMAC-SHA-256 digests, never as raw emails or IP
 * addresses. The pepper means someone with a copy of the table cannot recover
 * who was being targeted by hashing a list of likely addresses.
 */

interface ThrottleKey {
  kind: AttemptKind;
  hash: string;
}

function digest(value: string): string {
  return createHmac("sha256", supabaseEnv().AUTH_THROTTLE_PEPPER)
    .update(value)
    .digest("hex");
}

/** The three keys an attempt is counted under. See lockout.ts for why. */
export function throttleKeys(email: string, ip: string): ThrottleKey[] {
  const normalisedEmail = email.trim().toLowerCase();
  return [
    { kind: "email", hash: digest(`email:${normalisedEmail}`) },
    { kind: "ip", hash: digest(`ip:${ip}`) },
    { kind: "email_ip", hash: digest(`email_ip:${normalisedEmail}|${ip}`) },
  ];
}

export interface PendingAttempt {
  ids: number[];
  decision: LockoutDecision;
}

/**
 * Record an attempt as PENDING, then decide whether it may proceed.
 *
 * The order is the point. Writing the pending row before reading the counts
 * means simultaneous requests can see each other, so a burst of parallel
 * guesses cannot all read the same pre-lockout count and slip through
 * together. The attempt's own rows are excluded from its own decision.
 */
export async function beginAttempt(
  keys: readonly ThrottleKey[],
): Promise<PendingAttempt> {
  const db = secretClient();

  const { data: inserted, error: insertError } = await db
    .from("login_attempts")
    .insert(
      keys.map((key) => ({
        key_hash: key.hash,
        key_kind: key.kind,
        outcome: "pending" satisfies AttemptOutcome,
      })),
    )
    .select("id");

  if (insertError) throw insertError;
  const ids = (inserted ?? []).map((row) => row.id as number);

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data: rows, error: readError } = await db
    .from("login_attempts")
    .select("id, key_kind, outcome, created_at")
    .in(
      "key_hash",
      keys.map((key) => key.hash),
    )
    .gte("created_at", since)
    .not("id", "in", `(${ids.join(",")})`);

  if (readError) throw readError;

  const attempts: Attempt[] = (rows ?? []).map((row) => ({
    kind: row.key_kind as AttemptKind,
    outcome: row.outcome as AttemptOutcome,
    at: new Date(row.created_at as string),
  }));

  return { ids, decision: decideLockout(attempts, new Date()) };
}

/** Resolve a pending attempt once its outcome is known. */
export async function settleAttempt(
  ids: readonly number[],
  outcome: Exclude<AttemptOutcome, "pending">,
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await secretClient()
    .from("login_attempts")
    .update({ outcome })
    .in("id", [...ids]);
  if (error) throw error;
}
