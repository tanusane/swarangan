import {
  STUDENT_CATEGORIES,
  STUDENT_MODES,
  type Student,
} from "@/lib/students/schema";

/**
 * Dashboard figures, computed from the roster.
 *
 * Pure functions over plain rows, so every number on the dashboard is covered by
 * a test rather than trusted. Counts are of ACTIVE students unless a function
 * says otherwise — a student who left last year should not inflate "how many
 * students do we teach".
 */

export interface Slice {
  key: string;
  label: string;
  value: number;
}

export interface MonthPoint {
  /** "2026-09" */
  month: string;
  /** "Sep 26" */
  label: string;
  value: number;
}

type RosterRow = Pick<
  Student,
  "category" | "level" | "mode" | "status" | "joined_on"
>;

const active = (rows: readonly RosterRow[]) =>
  rows.filter((row) => row.status === "active");

/** Headline counts for the stat cards. */
export function rosterTotals(rows: readonly RosterRow[]) {
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    paused: rows.filter((row) => row.status === "paused").length,
    left: rows.filter((row) => row.status === "left").length,
  };
}

/**
 * Count active students per option, in the options' own order, always listing
 * every option (a zero is information: "no advanced students yet").
 */
function countByOption(
  rows: readonly RosterRow[],
  field: "category" | "mode",
  options: readonly { value: string; label: string }[],
): Slice[] {
  return options.map((option) => ({
    key: option.value,
    label: option.label,
    value: active(rows).filter((row) => row[field] === option.value).length,
  }));
}

export const byCategory = (rows: readonly RosterRow[]) =>
  countByOption(rows, "category", STUDENT_CATEGORIES);

export const byMode = (rows: readonly RosterRow[]) =>
  countByOption(rows, "mode", STUDENT_MODES);

/**
 * Active students per level. Levels are free text, so they are grouped
 * case-insensitively and sorted naturally ("Level 2" before "Level 10").
 */
export function byLevel(rows: readonly RosterRow[]): Slice[] {
  const groups = new Map<string, Slice>();

  for (const row of active(rows)) {
    const key = row.level.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) existing.value += 1;
    else groups.set(key, { key, label: row.level.trim(), value: 1 });
  }

  return [...groups.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  );
}

/**
 * Fixed names rather than Intl: locale month abbreviations vary by runtime and
 * locale ("Sep" vs "Sept"), and a chart axis should not change between the
 * server and a test run.
 */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The `count` calendar months ending with the month containing `now`, oldest first. */
export function lastMonths(now: Date, count: number): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    points.push({
      month: date.toISOString().slice(0, 7),
      label: `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}`,
      value: 0,
    });
  }
  return points;
}

/** How many students joined in each of the last `count` months (any status). */
export function joinsByMonth(
  rows: readonly RosterRow[],
  now: Date,
  count = 12,
): MonthPoint[] {
  const points = lastMonths(now, count);
  const index = new Map(points.map((point, i) => [point.month, i]));

  for (const row of rows) {
    const i = index.get(row.joined_on.slice(0, 7));
    if (i !== undefined) points[i]!.value += 1;
  }
  return points;
}

/** How many enquiries arrived in each of the last `count` months. */
export function enquiriesByMonth(
  createdAt: readonly string[],
  now: Date,
  count = 12,
): MonthPoint[] {
  const points = lastMonths(now, count);
  const index = new Map(points.map((point, i) => [point.month, i]));

  for (const timestamp of createdAt) {
    const i = index.get(timestamp.slice(0, 7));
    if (i !== undefined) points[i]!.value += 1;
  }
  return points;
}
