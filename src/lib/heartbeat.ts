/**
 * Keepalive health, as shown on the admin dashboard.
 *
 * Supabase pauses a free project after about a week without database activity,
 * and restoring it is a MANUAL click in the Supabase dashboard. Two independent
 * daily crons prevent that (Vercel Cron and a GitHub Action). This turns their
 * heartbeat into something Amit can see, so a cron that silently stopped is
 * noticed days before the project actually pauses — not after the admin panel
 * has already stopped loading.
 */

/** Both crons run daily, so two missed days means something is wrong. */
export const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

export type HeartbeatHealth =
  | { status: "healthy"; ageMs: number }
  | { status: "stale"; ageMs: number }
  | { status: "missing" };

export function heartbeatHealth(
  beatAt: Date | null,
  now: Date,
): HeartbeatHealth {
  if (!beatAt) return { status: "missing" };
  const ageMs = Math.max(0, now.getTime() - beatAt.getTime());
  return ageMs > STALE_AFTER_MS
    ? { status: "stale", ageMs }
    : { status: "healthy", ageMs };
}

/** "3 hours ago", "2 days ago" — coarse on purpose; this is a health light. */
export function describeAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
