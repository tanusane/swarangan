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
 * Amit was undecided about publishing these, so the section is fully built but
 * switched OFF. Nothing is invented here: the list is intentionally empty
 * rather than filled with plausible-looking prices, because a wrong fee on a
 * live site is worse than no fee at all.
 *
 * Phase 2 moves this to the Supabase `fee_plans` table with a `published`
 * column, at which point Tanuja can enter the real figures and reveal the
 * section herself from the admin panel — no code change.
 */
export const FEES_PUBLISHED = false;

export const feePlans: readonly FeePlan[] = [];
