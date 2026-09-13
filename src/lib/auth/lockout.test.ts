import { describe, expect, it } from "vitest";

import {
  decideLockout,
  WINDOW_MS,
  type Attempt,
  type AttemptKind,
  type AttemptOutcome,
} from "@/lib/auth/lockout";

/**
 * The lockout policy is the brute-force defence for the admin login, so its
 * rules are pinned down here case by case rather than assumed.
 */

const NOW = new Date("2026-09-13T10:00:00Z");

/** An attempt `secondsAgo` seconds before NOW. */
function attempt(
  kind: AttemptKind,
  outcome: AttemptOutcome,
  secondsAgo: number,
): Attempt {
  return { kind, outcome, at: new Date(NOW.getTime() - secondsAgo * 1000) };
}

/** `count` failures of one kind, one second apart, the newest `newestAgo` seconds ago. */
function failures(kind: AttemptKind, count: number, newestAgo = 1): Attempt[] {
  return Array.from({ length: count }, (_, i) =>
    attempt(kind, "failure", newestAgo + i),
  );
}

describe("decideLockout", () => {
  it("allows a first attempt", () => {
    expect(decideLockout([], NOW)).toEqual({
      retryAfterSeconds: 0,
      lockedBy: null,
    });
  });

  it("allows up to four failures from the same email and IP", () => {
    expect(decideLockout(failures("email_ip", 4), NOW).retryAfterSeconds).toBe(
      0,
    );
  });

  it("locks for about a minute at the fifth failure", () => {
    const decision = decideLockout(failures("email_ip", 5), NOW);
    expect(decision.lockedBy).toBe("email_ip");
    expect(decision.retryAfterSeconds).toBe(59);
  });

  it("escalates: 2 minutes, then 5, then 15", () => {
    expect(decideLockout(failures("email_ip", 6), NOW).retryAfterSeconds).toBe(
      119,
    );
    expect(decideLockout(failures("email_ip", 7), NOW).retryAfterSeconds).toBe(
      299,
    );
    expect(decideLockout(failures("email_ip", 8), NOW).retryAfterSeconds).toBe(
      899,
    );
    // It does not keep growing past the cap.
    expect(decideLockout(failures("email_ip", 30), NOW).retryAfterSeconds).toBe(
      899,
    );
  });

  it("releases once the lockout has elapsed", () => {
    // Five failures, the latest 61 seconds ago: the 60-second lock is over.
    expect(
      decideLockout(failures("email_ip", 5, 61), NOW).retryAfterSeconds,
    ).toBe(0);
  });

  it("forgets failures older than the window", () => {
    const old = failures("email_ip", 8, WINDOW_MS / 1000 + 5);
    expect(decideLockout(old, NOW).retryAfterSeconds).toBe(0);
  });

  it("resets a key after a successful login", () => {
    const history = [
      ...failures("email_ip", 4, 100),
      attempt("email_ip", "success", 50),
      ...failures("email_ip", 2, 10),
    ];
    // Only the two failures after the success count.
    expect(decideLockout(history, NOW).retryAfterSeconds).toBe(0);
  });

  describe("does not let an attacker extend a lockout", () => {
    it("ignores attempts that were refused while locked", () => {
      const history = [
        ...failures("email_ip", 5, 30),
        // Fifty hammering attempts during the lockout, all refused.
        ...Array.from({ length: 50 }, (_, i) =>
          attempt("email_ip", "blocked", i),
        ),
      ];
      // The lock still runs from the fifth real failure, 30s ago.
      expect(decideLockout(history, NOW).retryAfterSeconds).toBe(30);
    });
  });

  describe("closes the concurrency race", () => {
    it("counts in-flight attempts as failures", () => {
      // Four finished failures plus one attempt still being checked: a
      // simultaneous fifth request must already see five.
      const history = [
        ...failures("email_ip", 4, 5),
        attempt("email_ip", "pending", 0),
      ];
      expect(decideLockout(history, NOW).retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("the three keys", () => {
    it("throttles one machine spraying guesses at many accounts", () => {
      expect(decideLockout(failures("ip", 5), NOW).lockedBy).toBe("ip");
    });

    it("does NOT let one attacker lock the admin's email out with a handful of tries", () => {
      // Ten failures against the admin email, from somewhere else entirely.
      expect(decideLockout(failures("email", 10), NOW).retryAfterSeconds).toBe(
        0,
      );
    });

    it("does catch a distributed attack on one account", () => {
      const decision = decideLockout(failures("email", 20), NOW);
      expect(decision.lockedBy).toBe("email");
      expect(decision.retryAfterSeconds).toBe(899);
    });

    it("applies the strictest lockout when several keys are tripped", () => {
      const history = [...failures("email_ip", 5), ...failures("ip", 8)];
      const decision = decideLockout(history, NOW);
      expect(decision.lockedBy).toBe("ip");
      expect(decision.retryAfterSeconds).toBe(899);
    });

    it("keeps the keys independent", () => {
      // Failures on one key never count towards another.
      const history = [...failures("email", 4), ...failures("ip", 4)];
      expect(decideLockout(history, NOW).retryAfterSeconds).toBe(0);
    });
  });
});
