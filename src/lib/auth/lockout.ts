/**
 * Login lockout policy.
 *
 * Pure: takes the recent attempts and the current time, returns how long to
 * refuse. No database, no clock of its own — which is why every rule below can
 * be proven by a unit test rather than trusted.
 *
 * WHY THREE KEYS
 * Throttling on a single key is either weak or abusable:
 *
 *   - IP only       An attacker rotating addresses is never slowed.
 *   - email only    Anyone who knows Tanuja's address can lock her out of her
 *                   own site at will, from anywhere.
 *
 * So attempts are counted three ways, each with its own threshold:
 *
 *   email_ip  The same address from the same place. The tight, everyday
 *             limit: 5 failures and the lockout begins, escalating to 15
 *             minutes.
 *   ip        Everything from one address, whichever account it targets. Same
 *             tight limit — stops one machine spraying guesses.
 *   email     One account from anywhere. A deliberately HIGH threshold (20).
 *             It exists to catch a distributed attack on the admin account,
 *             while being far too high for a single attacker to trip casually
 *             and lock the real admin out.
 *
 * The strictest applicable lockout wins.
 *
 * WHY THESE RULES
 *   - A success resets its key, so a legitimate typo streak does not follow
 *     someone forever.
 *   - "blocked" attempts (refused while already locked) are NOT counted.
 *     Otherwise an attacker hammering a locked account would extend the lockout
 *     indefinitely and keep the real admin out.
 *   - "pending" attempts ARE counted as failures. The login action records the
 *     attempt before checking the password, so concurrent requests see each
 *     other; counting them closes the race where many simultaneous guesses all
 *     read the same pre-lockout count and all get through.
 */

export type AttemptKind = "email" | "ip" | "email_ip";
export type AttemptOutcome = "pending" | "failure" | "success" | "blocked";

export interface Attempt {
  kind: AttemptKind;
  outcome: AttemptOutcome;
  at: Date;
}

/** Only attempts newer than this are considered at all. */
export const WINDOW_MS = 15 * 60 * 1000;

/**
 * Failures-in-window -> lockout seconds, per key kind. Read as "at N or more
 * failures, lock for S seconds"; the highest matching step applies.
 */
export const LOCKOUT_STEPS: Readonly<
  Record<AttemptKind, readonly (readonly [number, number])[]>
> = {
  email_ip: [
    [5, 60],
    [6, 120],
    [7, 300],
    [8, 900],
  ],
  ip: [
    [5, 60],
    [6, 120],
    [7, 300],
    [8, 900],
  ],
  email: [[20, 900]],
};

export interface LockoutDecision {
  /** Whole seconds until another attempt is allowed. 0 means allowed now. */
  retryAfterSeconds: number;
  /** Which key imposed the lockout, for the audit log. Null when allowed. */
  lockedBy: AttemptKind | null;
}

function lockoutSecondsFor(kind: AttemptKind, failures: number): number {
  let seconds = 0;
  for (const [threshold, duration] of LOCKOUT_STEPS[kind]) {
    if (failures >= threshold) seconds = duration;
  }
  return seconds;
}

/**
 * Decide whether a new attempt may proceed.
 *
 * @param attempts Recent attempts for this request's keys, EXCLUDING the
 *                 attempt currently being decided.
 * @param now      The current time. Injected so tests control the clock.
 */
export function decideLockout(
  attempts: readonly Attempt[],
  now: Date,
): LockoutDecision {
  const windowStart = now.getTime() - WINDOW_MS;
  let decision: LockoutDecision = { retryAfterSeconds: 0, lockedBy: null };

  for (const kind of Object.keys(LOCKOUT_STEPS) as AttemptKind[]) {
    const recent = attempts.filter(
      (attempt) => attempt.kind === kind && attempt.at.getTime() > windowStart,
    );

    // A success resets the count for this key.
    const lastSuccess = Math.max(
      -Infinity,
      ...recent
        .filter((attempt) => attempt.outcome === "success")
        .map((attempt) => attempt.at.getTime()),
    );

    const failures = recent.filter(
      (attempt) =>
        (attempt.outcome === "failure" || attempt.outcome === "pending") &&
        attempt.at.getTime() > lastSuccess,
    );

    const duration = lockoutSecondsFor(kind, failures.length);
    if (duration === 0) continue;

    // The lockout runs from the most recent counted failure.
    const lastFailure = Math.max(...failures.map((a) => a.at.getTime()));
    const remainingMs = lastFailure + duration * 1000 - now.getTime();
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

    if (remaining > decision.retryAfterSeconds) {
      decision = { retryAfterSeconds: remaining, lockedBy: kind };
    }
  }

  return decision;
}
