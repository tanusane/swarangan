/**
 * The client's IP address, for the login throttle's per-IP key.
 *
 * TRUST ASSUMPTION — read before changing hosts.
 * This relies on Vercel, which OVERWRITES the incoming x-forwarded-for header
 * rather than appending to it, so a visitor cannot forge their address (this is
 * documented Vercel behaviour). On a host that passes the header through
 * untouched, an attacker could send a fresh fake address with every guess and
 * walk straight past the per-IP limit. The email+IP and email-only limits would
 * still hold, but the IP key would be worthless. If this site ever moves off
 * Vercel, revisit this function first.
 */
export function clientIpFrom(forwardedFor: string | null): string {
  // Vercel sets a single address; take the first entry defensively in case a
  // proxy in front ever adds more.
  const first = forwardedFor?.split(",")[0]?.trim();

  // "unknown" only happens outside Vercel (e.g. local development). All such
  // requests share one IP key, which is conservative rather than permissive.
  return first && first.length > 0 ? first : "unknown";
}
