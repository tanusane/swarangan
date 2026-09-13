export interface FeePlan {
  key: string;
  title: string;
  /** Displayed verbatim, e.g. "S$120 / month". */
  price: string;
  /** How often the class runs, e.g. "Once a week, 60 minutes". */
  cadence: string;
  note?: string;
}

/**
 * Fees and batch timings.
 *
 * Nothing is invented here: the list is intentionally empty rather than filled
 * with plausible-looking prices, because a wrong fee on a live site is worse
 * than no fee at all. The fees section only appears once a plan is published.
 *
 * This is only the fallback before the admin import. Real fees live in the
 * `fee_plans` table, entered and published from Admin → Classes & fees.
 */
export const feePlans: readonly FeePlan[] = [];
