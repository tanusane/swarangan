import "server-only";

import { requireAdmin } from "@/lib/auth/dal";
import { heartbeatHealth, type HeartbeatHealth } from "@/lib/heartbeat";
import type { Student } from "@/lib/students/schema";
import {
  byCategory,
  byLevel,
  byMode,
  enquiriesByMonth,
  joinsByMonth,
  rosterTotals,
  type MonthPoint,
  type Slice,
} from "@/lib/students/stats";
import { sessionClient } from "@/lib/supabase/clients";

export interface SignInEvent {
  id: number;
  email: string;
  blocked: boolean;
}

export interface DashboardStats {
  totals: ReturnType<typeof rosterTotals>;
  newEnquiries: number;
  categories: Slice[];
  modes: Slice[];
  levels: Slice[];
  joins: MonthPoint[];
  enquiries: MonthPoint[];
}

export interface DashboardData {
  health: HeartbeatHealth;
  heartbeatSource: string | null;
  recentFailures: SignInEvent[];
  stats: DashboardStats;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTHS_SHOWN = 12;

/**
 * Everything the admin dashboard shows, loaded in one place.
 *
 * Reads through the SESSION client, so row-level security still applies: if
 * the admin check were ever bypassed, these queries would return nothing rather
 * than leak. The figures themselves come from the pure, tested functions in
 * lib/students/stats.ts. The clock is read here, keeping the page pure.
 */
export async function loadDashboard(): Promise<DashboardData> {
  await requireAdmin();
  const supabase = await sessionClient();
  const now = new Date();
  const yearAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_SHOWN - 1), 1),
  ).toISOString();

  const [
    { data: beat },
    { data: events },
    { data: students },
    { data: enquiryDates },
    { count: newEnquiries },
  ] = await Promise.all([
    supabase.from("system_heartbeat").select("beat_at, source").maybeSingle(),
    supabase
      .from("admin_audit_log")
      .select("id, action, detail")
      .in("action", ["auth.sign_in_failed", "auth.sign_in_blocked"])
      .gte("created_at", new Date(now.getTime() - WEEK_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("students")
      .select("category, level, mode, status, joined_on"),
    supabase.from("enquiries").select("created_at").gte("created_at", yearAgo),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  const roster = (students ?? []) as Pick<
    Student,
    "category" | "level" | "mode" | "status" | "joined_on"
  >[];

  return {
    health: heartbeatHealth(
      beat?.beat_at ? new Date(beat.beat_at as string) : null,
      now,
    ),
    heartbeatSource: (beat?.source as string | undefined) ?? null,
    recentFailures: (events ?? []).map((event) => ({
      id: event.id as number,
      email: (event.detail as { email?: string }).email ?? "unknown",
      blocked: event.action === "auth.sign_in_blocked",
    })),
    stats: {
      totals: rosterTotals(roster),
      newEnquiries: newEnquiries ?? 0,
      categories: byCategory(roster),
      modes: byMode(roster),
      levels: byLevel(roster),
      joins: joinsByMonth(roster, now, MONTHS_SHOWN),
      enquiries: enquiriesByMonth(
        (enquiryDates ?? []).map((row) => row.created_at as string),
        now,
        MONTHS_SHOWN,
      ),
    },
  };
}
