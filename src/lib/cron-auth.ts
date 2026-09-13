import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Whether a request carries the cron shared secret.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; the GitHub Action
 * sends the same. Compared in constant time so the secret cannot be recovered
 * a character at a time by measuring how quickly wrong guesses are rejected.
 *
 * Both sides are hashed first: timingSafeEqual requires equal-length buffers,
 * and comparing fixed-length digests means the secret's length does not leak
 * either.
 */
export function isAuthorizedCron(
  authorizationHeader: string | null,
  secret: string,
): boolean {
  if (!authorizationHeader || !secret) return false;

  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const received = createHash("sha256").update(authorizationHeader).digest();

  return timingSafeEqual(expected, received);
}
