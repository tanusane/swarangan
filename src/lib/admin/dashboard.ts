import "server-only";

import { requireAdmin } from "@/lib/auth/dal";
import { heartbeatHealth, type HeartbeatHealth } from "@/lib/heartbeat";
import { sessionClient } from "@/lib/supabase/clients";

export interface SignInEvent {
  id: number;
  email: string;
  blocked: boolean;
}

export interface DashboardData {
  health: HeartbeatHealth;
  heartbeatSource: string | null;
  recentFailures: SignInEvent[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Everything the admin dashboard shows, loaded in one place.
 *
 * Reads through the SESSION client, so row-level security still applies: if
 * the admin check were ever bypassed, these queries would return nothing rather
 * than leak. The clock is read here rather than in the page, keeping the page
 * component pure.
 */
export async function loadDashboard(): Promise<DashboardData> {
  await requireAdmin();
  const supabase = await sessionClient();
  const now = new Date();

  const [{ data: beat }, { data: events }] = await Promise.all([
    supabase.from("system_heartbeat").select("beat_at, source").maybeSingle(),
    supabase
      .from("admin_audit_log")
      .select("id, action, detail")
      .in("action", ["auth.sign_in_failed", "auth.sign_in_blocked"])
      .gte("created_at", new Date(now.getTime() - WEEK_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

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
  };
}
